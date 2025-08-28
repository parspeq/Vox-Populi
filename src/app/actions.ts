
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { topics, posts, users, chats, messages, chatParticipants, reportedPosts, reportVotes, rateLimitEvents, polls, pollOptions, pollVotes } from '@/lib/schema';
import { getCurrentUser } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { eq, and, sql, inArray, gt, count, desc, lt, or, ilike } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { hash, compare } from 'bcryptjs';
import { createSession, encrypt, decrypt } from '@/lib/session';
import { cookies, headers } from 'next/headers';
import type { Message, Poll } from '@/lib/types';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { checkSignUpRateLimit, checkRateLimit } from '@/lib/rate-limiter';
import { verifyEmailWithApi, checkStopForumSpam } from '@/lib/email-verifier';
import { generateInitialAvatar } from '@/lib/utils';
import { ActionType } from '@/config/rate-limits';

export async function createTopic(values: { title: string, description: string, color?: string }) {
  const createTopicSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters long." }).max(500),
    color: z.string().optional(),
  });

  const validatedFields = createTopicSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not create topic.',
    };
  }
  
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { message: 'You must be logged in to create a topic.' };
  }
  
  try {
    await checkRateLimit(currentUser.id, ActionType.CREATE_TOPIC);

    const { title, description, color } = validatedFields.data;
    const topicId = randomUUID();
    const postId = randomUUID();
    const chatId = randomUUID();
    
    const authorId = currentUser.id;
    const now = new Date();

    await db.insert(topics).values({
        id: topicId,
        title: title,
        authorId: authorId,
        replyCount: 0, 
        timestamp: now,
        lastActivityTimestamp: now,
    });

    await db.insert(posts).values({
        id: postId,
        content: description,
        authorId: authorId,
        topicId: topicId,
        parentId: null,
        color: color,
    });

    await db.insert(chats).values({
        id: chatId,
        name: title,
        topicId: topicId,
    });
  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      message: `${error.message || 'Failed to create topic.'}`,
    };
  }

  revalidatePath('/topics');
  revalidatePath('/chat');
  
  return {
    success: true,
    message: 'Topic created successfully.'
  };
}

const editPostSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, { message: "Content cannot be empty." }).max(500),
  color: z.string().optional(),
});

export async function editPost(values: z.infer<typeof editPostSchema>) {
  const validatedFields = editPostSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not edit post.',
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { message: 'You must be logged in to edit a post.' };
  }
  const authorId = currentUser.id;

  const { postId, content, color } = validatedFields.data;

  try {
    const postToEdit = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
    });

    if (!postToEdit) {
        return { message: 'Post not found.' };
    }

    if(postToEdit.authorId !== authorId) {
        return { message: 'You are not authorized to edit this post.' };
    }

    const existingReport = await db.query.reportedPosts.findFirst({
        where: and(
            eq(reportedPosts.postId, postId),
            eq(reportedPosts.status, 'pending')
        ),
    });

    if (existingReport) {
        return { message: 'This post cannot be edited while it is under community review.' };
    }


    await db.update(posts)
      .set({ content: content, color: color })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)));

    revalidatePath(`/topics/${postToEdit.topicId}`);
    return { success: true, message: 'Post updated successfully.' };
  } catch (error: any) {
    return {
      message: `Database Error: ${error.message || 'Failed to edit post.'}`,
    };
  }
}

const createReplySchema = z.object({
  content: z.string().min(1, { message: "Reply cannot be empty." }).max(500),
  topicId: z.string(),
  parentId: z.string(),
  color: z.string().optional(),
});

export async function createReply(values: z.infer<typeof createReplySchema>) {
    const validatedFields = createReplySchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed. Could not create reply.',
        };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { message: 'You must be logged in to reply.' };
    }
    
    try {
        await checkRateLimit(currentUser.id, ActionType.CREATE_REPLY);
        
        const authorId = currentUser.id;
        const { content, topicId, parentId, color } = validatedFields.data;
        const replyId = randomUUID();

        await db.insert(posts).values({
            id: replyId,
            content: content,
            authorId: authorId,
            topicId: topicId,
            parentId: parentId,
            color: color,
        });

        await db.update(topics)
            .set({ 
              replyCount: sql`${topics.replyCount} + 1`,
              lastActivityTimestamp: new Date(),
            })
            .where(eq(topics.id, topicId));
            
        revalidatePath(`/topics/${topicId}`);

    } catch (error: any) {
        console.error('Database Error:', error);
        return {
            message: `${error.message || 'Failed to create reply.'}`,
        };
    }

    return {
        success: true,
        message: 'Reply created successfully.'
    };
}


export async function deleteTopic(topicId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to delete a topic.' };
    }
    const authorId = currentUser.id;

    const topic = await db.query.topics.findFirst({
        where: eq(topics.id, topicId),
        with: {
            chat: true
        }
    });

    if (!topic) {
        return { success: false, message: 'Topic not found.' };
    }

    if (topic.authorId !== authorId) {
        return { success: false, message: 'You are not authorized to delete this topic.' };
    }

    try {
        // Delete all posts associated with the topic first
        await db.delete(posts).where(eq(posts.topicId, topicId));
        
        // If there's an associated chat, delete its messages, participants, then the chat itself
        if (topic.chat) {
            await db.delete(messages).where(eq(messages.chatId, topic.chat.id));
            await db.delete(chatParticipants).where(eq(chatParticipants.chatId, topic.chat.id));
            await db.delete(chats).where(eq(chats.id, topic.chat.id));
        }
        
        // Finally, delete the topic
        await db.delete(topics).where(eq(topics.id, topicId));

  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      success: false,
      message: `${error.message || 'Failed to delete topic.'}`,
    };
  }
  
  revalidatePath('/topics');
  revalidatePath('/chat');
  redirect('/topics');
}


// Helper function to get all descendant post IDs
async function getPostDescendants(postId: string): Promise<string[]> {
    const allDescendants: string[] = [];
    const queue: string[] = [postId];
    
    while (queue.length > 0) {
        const currentPostId = queue.shift()!;
        const children = await db.query.posts.findMany({
            where: eq(posts.parentId, currentPostId),
            columns: {
                id: true
            }
        });

        for (const child of children) {
            allDescendants.push(child.id);
            queue.push(child.id);
        }
    }
    return allDescendants;
}

export async function deletePost(postId: string, topicId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to delete a post.' };
    }
    const authorId = currentUser.id;

    try {
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, postId),
        });

        if (!post) {
            return { success: false, message: 'Post not found.' };
        }

        if (post.authorId !== authorId) {
            return { success: false, message: 'You are not authorized to delete this post.' };
        }

        const descendantIds = await getPostDescendants(postId);
        const idsToDelete = [postId, ...descendantIds];
        const numToDelete = idsToDelete.length;
        
        await db.delete(posts).where(inArray(posts.id, idsToDelete));
        
        await db.update(topics)
            .set({ 
                replyCount: sql`${topics.replyCount} - ${numToDelete}`,
                lastActivityTimestamp: new Date(),
            })
            .where(eq(topics.id, topicId));

    } catch (error: any) {
        console.error('Database Error:', error);
        return {
            success: false,
            message: `Database Error: ${error.message || 'Failed to delete post.'}`,
        };
    }

    revalidatePath(`/topics/${topicId}`);
    return { success: true, message: 'Post deleted successfully.' };
}

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  age: z.coerce.number().int().positive().gte(18, { message: "You must be 18 or older to sign up." }).lte(99, { message: "Please enter a valid age." }),
  password: z.string().min(20, { message: "Password must be at least 20 characters long." }),
  honeypot: z.string().optional(),
  formLoadTime: z.coerce.number(),
});

export async function signUp(values: z.infer<typeof signUpSchema>) {
    // Honeypot & time-based checks
    if (values.honeypot || (Date.now() - values.formLoadTime) < 3000) {
        return { message: 'Spam detected.' };
    }

    const validatedFields = signUpSchema.safeParse(values);
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed. Could not sign up.',
        };
    }
    
    const rateLimitResult = await checkSignUpRateLimit();
    if (!rateLimitResult.success) {
        return { message: rateLimitResult.message };
    }

    const { name, email, password, age } = validatedFields.data;

    const emailVerificationResult = await verifyEmailWithApi(email);
    if (!emailVerificationResult.success) {
        return { message: emailVerificationResult.message };
    }

    const spamCheckResult = await checkStopForumSpam(email);
    if (!spamCheckResult.success) {
        return { message: spamCheckResult.message };
    }


    const existingUserByEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existingUserByEmail) {
        return { message: 'A user with this email already exists.' };
    }
    
    const existingUserByName = await db.query.users.findFirst({ where: ilike(users.name, name) });
    if (existingUserByName) {
        return { message: 'This username is already taken. Please choose another.' };
    }

    const hashedPassword = await hash(password, 10);
    const userId = randomUUID();
    const avatar = generateInitialAvatar(name);

    try {
        const registrationData = {
            userId,
            name,
            email,
            age,
            hashedPassword,
            avatar,
        };
        
        const tempSession = await encrypt({ registrationData });
        cookies().set('temp-session', tempSession, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 15, // 15 minutes
            sameSite: 'lax',
            path: '/',
        });

    } catch (error: any) {
        console.error('[Sign Up] Session Encryption Error:', error);
        return { message: 'An unexpected error occurred during sign up.' };
    }
    
    redirect('/setup-2fa');
}


const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
});

export async function login(values: z.infer<typeof loginSchema>) {
    cookies().delete('session');
    
    const validatedFields = loginSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!existingUser || !existingUser.hashedPassword) {
        return { message: 'Invalid credentials.' };
    }
    
    if (existingUser.lockoutUntil && existingUser.lockoutUntil > new Date()) {
        const minutesRemaining = Math.ceil((existingUser.lockoutUntil.getTime() - new Date().getTime()) / 60000);
        return { message: `Account is temporarily locked. Please try again in ${minutesRemaining} minutes.` };
    }

    const passwordsMatch = await compare(password, existingUser.hashedPassword);

    if (!passwordsMatch) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const currentTimestamps = (Array.isArray(existingUser.failedLoginAttemptTimestamps) ? existingUser.failedLoginAttemptTimestamps : []) as Date[];
        
        const recentTimestamps = currentTimestamps.filter(ts => new Date(ts) > twentyFourHoursAgo);
        recentTimestamps.push(now);

        const attemptsInLastHour = recentTimestamps.filter(ts => new Date(ts) > oneHourAgo).length;
        const attemptsInLast24Hours = recentTimestamps.length;

        let lockoutUpdate: {
            failedLoginAttemptTimestamps: Date[],
            lockoutUntil?: Date | null
        } = {
            failedLoginAttemptTimestamps: recentTimestamps
        };
        
        let message = 'Invalid credentials.';

        if (attemptsInLastHour >= 25) {
            lockoutUpdate.lockoutUntil = new Date(now.getTime() + 60 * 60 * 1000); // Lock for 1 hour
            message = 'Too many failed login attempts. Your account has been locked for 1 hour.';
        } else if (attemptsInLast24Hours >= 10) {
            lockoutUpdate.lockoutUntil = new Date(now.getTime() + 15 * 60 * 1000); // Lock for 15 minutes
            message = 'Too many failed login attempts. Your account has been locked for 15 minutes.';
        }

        await db.update(users).set(lockoutUpdate).where(eq(users.id, existingUser.id));

        return { message };
    }

    if (Array.isArray(existingUser.failedLoginAttemptTimestamps) && (existingUser.failedLoginAttemptTimestamps.length > 0 || existingUser.lockoutUntil)) {
        await db.update(users).set({ 
            failedLoginAttemptTimestamps: [],
            lockoutUntil: null,
        }).where(eq(users.id, existingUser.id));
    }


    if (existingUser.isTwoFactorEnabled) {
        const twoFactorToken = await encrypt({ userId: existingUser.id, is2FA: true });
        cookies().set('2fa-token', twoFactorToken, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 5, // 5 minutes
            sameSite: 'lax',
            path: '/',
        });
        return { twoFactor: true };
    }
    
    await createSession({ userId: existingUser.id });
    redirect('/statistics');
}

export async function logout() {
    const cookieStore = cookies();
    cookieStore.delete('session');
    redirect('/login');
}


export async function sendMessage(chatId: string, content: string, color?: string): Promise<{ success: boolean; message?: Message | string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to send a message.' };
    }
    
    if (!content.trim()) {
        return { success: false, message: 'Message cannot be empty.' };
    }

    try {
        await checkRateLimit(currentUser.id, ActionType.SEND_CHAT_MESSAGE);
        
        const messageId = randomUUID();

        await db.insert(messages).values({
            id: messageId,
            chatId,
            senderId: currentUser.id,
            content,
            color,
        });

        const newMessage = await db.query.messages.findFirst({
            where: eq(messages.id, messageId),
            with: {
                sender: true,
            },
        });

        if (!newMessage) {
            return { success: false, message: 'Failed to retrieve sent message.' };
        }
        
        revalidatePath(`/chat`);

        return { success: true, message: { ...newMessage, timestamp: new Date(newMessage.timestamp) } };
    } catch (error: any) {
        console.error('Send message error:', error);
        return { success: false, message: `${error.message || 'Failed to send message.'}` };
    }
}

export async function getChatState(chatId: string, lastMessageTimestamp: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return null; // Return null if user is not logged in
        }

        const chat = await db.query.chats.findFirst({
            where: eq(chats.id, chatId),
        });

        if (!chat) {
            return { chatExists: false, newMessages: [] };
        }

        const newMessages = await db.query.messages.findMany({
            where: and(
                eq(messages.chatId, chatId),
                gt(messages.timestamp, new Date(lastMessageTimestamp))
            ),
            with: {
                sender: true,
            },
            orderBy: (messages, { asc }) => [asc(messages.timestamp)],
        });

        return { chatExists: true, newMessages };
    } catch (error) {
        console.error('Get chat state error:', error);
        return { chatExists: false, newMessages: [] };
    }
}


// --- 2FA Actions ---

export async function generateTwoFactorSecret() {
    const tempSessionCookie = await cookies().get('temp-session')?.value;
    const session = await decrypt(tempSessionCookie);
    let registrationData = session?.registrationData as any;

    if (!registrationData?.email) {
        return { error: "Session expired or invalid. Please sign up again." };
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(registrationData.email, 'Vox Populi', secret);
    
    // Add the secret to the registration data and re-encrypt the session
    registrationData.twoFactorSecret = secret;

    const tempSession = await encrypt({ registrationData });
    cookies().set('temp-session', tempSession, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 15, // 15 minutes
        sameSite: 'lax',
        path: '/',
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeDataURL };
}

export async function verifyAndEnableTwoFactor(code: string) {
    const tempSessionCookie = await cookies().get('temp-session')?.value;
    const session = await decrypt(tempSessionCookie);
    const registrationData = session?.registrationData as any;
    const { userId, name, email, hashedPassword, age, avatar, twoFactorSecret } = registrationData || {};

    if (!userId || !twoFactorSecret) {
        return { error: "Session expired or is invalid. Please sign up again." };
    }

    const isValid = authenticator.check(code, twoFactorSecret);

    if (!isValid) {
        return { error: "Invalid code. Please try again." };
    }

    const backupCodes = Array.from({ length: 10 }, () => randomUUID().substring(0, 8).toUpperCase());
    const hashedBackupCodes = await Promise.all(backupCodes.map(c => hash(c, 10)));

    // Now, create the user in the database
    try {
        await db.insert(users).values({
            id: userId,
            name,
            email,
            hashedPassword,
            age,
            avatar,
            twoFactorSecret,
            isTwoFactorEnabled: true,
            twoFactorBackupCodes: hashedBackupCodes
        });
    } catch (dbError) {
        console.error("Database user creation failed:", dbError);
        return { error: "Could not create your account. Please try again." };
    }

    cookies().delete('temp-session');

    return { success: true, backupCodes };
}

const verifyCodeSchema = z.object({
  code: z.string().length(6, { message: "Code must be 6 characters long." }),
});

export async function verifyTwoFactorCode(values: z.infer<typeof verifyCodeSchema>) {
    const validatedFields = verifyCodeSchema.safeParse(values);
    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    const { code } = validatedFields.data;

    const twoFactorTokenCookie = await cookies().get('2fa-token')?.value;
    const session = await decrypt(twoFactorTokenCookie);
    const userId = session?.userId as string;

    if (!userId) {
        return { message: "Session expired. Please log in again." };
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user || !user.twoFactorSecret) {
        return { message: "An error occurred. Please log in again." };
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    
    if (!isValid) {
         return { message: "Invalid code." };
    }

    cookies().delete('2fa-token');
    await createSession({ userId: user.id });
    redirect('/statistics');
}

export async function requestPasswordReset(email: string) {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    cookies().delete('session');

    if (!user) {
         redirect('/forgot-password?submitted=true');
    }

    const resetToken = await encrypt({ userId: user.id, isReset: true, exp: Date.now() + 10 * 60 * 1000 });
     cookies().set('reset-token', resetToken, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'lax',
        path: '/',
    });

    redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1, "Code cannot be empty"),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function resetPasswordWith2FA(values: z.infer<typeof resetPasswordSchema>) {
    const validatedFields = resetPasswordSchema.safeParse(values);
    if(!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    const { email, code, password } = validatedFields.data;

    const resetTokenCookie = await cookies().get('reset-token')?.value;
    const session = await decrypt(resetTokenCookie);
    const userIdFromToken = session?.userId as string;

    const user = await db.query.users.findFirst({ where: and(eq(users.email, email), eq(users.id, userIdFromToken)) });

    if (!user || !user.twoFactorSecret || !user.twoFactorBackupCodes) {
         return { message: "Invalid request. Please try again." };
    }

    const isTotpValid = authenticator.check(code, user.twoFactorSecret);
    
    let isBackupValid = false;
    let usedBackupCodeIndex = -1;
    const backupCodes = user.twoFactorBackupCodes as string[];

    for(let i=0; i < backupCodes.length; i++) {
        if (await compare(code, backupCodes[i])) {
            isBackupValid = true;
            usedBackupCodeIndex = i;
            break;
        }
    }

    if (!isTotpValid && !isBackupValid) {
        return { message: "Invalid code provided." };
    }
    
    const hashedPassword = await hash(password, 10);
    let newBackupCodes = [...backupCodes];
    if (isBackupValid) {
        newBackupCodes.splice(usedBackupCodeIndex, 1);
    }
    
    await db.update(users).set({
        hashedPassword,
        twoFactorBackupCodes: newBackupCodes
    }).where(eq(users.id, user.id));
    
    cookies().delete('reset-token');
    return { success: true };
}

// --- MODERATION ACTIONS ---

export async function reportPost(postId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to report a post.' };
    }

    try {
        await checkRateLimit(currentUser.id, ActionType.REPORT_CONTENT);

        const postToReport = await db.query.posts.findFirst({
            where: eq(posts.id, postId),
        });

        if (!postToReport) {
            return { success: false, message: 'Post not found.' };
        }

        if (postToReport.authorId === currentUser.id) {
            return { success: false, message: 'You cannot report your own post.' };
        }

        const existingReport = await db.query.reportedPosts.findFirst({
            where: and(
                eq(reportedPosts.postId, postId),
                eq(reportedPosts.status, 'pending')
            ),
        });

        if (existingReport) {
            return { success: false, message: 'This post has already been reported and is under review.' };
        }

        const reportId = randomUUID();
        await db.insert(reportedPosts).values({
            id: reportId,
            postId,
            reporterId: currentUser.id,
            status: 'pending',
            postContent: postToReport.content,
            postAuthorId: postToReport.authorId,
        });
    } catch (error: any) {
        return { success: false, message: `${error.message || 'Failed to report post.'}` };
    }
    
    revalidatePath(`/topics/${(await db.query.posts.findFirst({ where: eq(posts.id, postId) }))?.topicId}`);
    return { success: true, message: 'Post reported successfully. It will be reviewed by the community.' };
}

export async function reportChatMessage(messageId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to report a message.' };
    }
    
    try {
        await checkRateLimit(currentUser.id, ActionType.REPORT_CONTENT);

        const messageToReport = await db.query.messages.findFirst({
            where: eq(messages.id, messageId),
        });

        if (!messageToReport) {
            return { success: false, message: 'Message not found.' };
        }

        if (messageToReport.senderId === currentUser.id) {
            return { success: false, message: 'You cannot report your own message.' };
        }

        const existingReport = await db.query.reportedPosts.findFirst({
            where: and(
                eq(reportedPosts.messageId, messageId),
                eq(reportedPosts.status, 'pending')
            ),
        });

        if (existingReport) {
            return { success: false, message: 'This message has already been reported and is under review.' };
        }

        await db.insert(reportedPosts).values({
            id: randomUUID(),
            messageId,
            reporterId: currentUser.id,
            postContent: messageToReport.content,
            postAuthorId: messageToReport.senderId,
            status: 'pending',
        });
    } catch (error: any) {
        return { success: false, message: `${error.message || 'Failed to report message.'}` };
    }

    revalidatePath('/chat');
    return { success: true, message: 'Message reported successfully. It will be reviewed by the community.' };
}

export async function voteOnReport(reportId: string): Promise<{success: boolean; message: string; banned?: boolean}> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to vote.' };
    }
    
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const isAccountOldEnough = currentUser.createdAt < fifteenDaysAgo;
    const hasEnoughPosts = currentUser.posts.length >= 10;

    if (!isAccountOldEnough && !hasEnoughPosts) {
        return { success: false, message: 'You do not currently meet the requirements to be able to vote, try again later' };
    }

    const report = await db.query.reportedPosts.findFirst({
        where: eq(reportedPosts.id, reportId),
    });

    if (!report) {
        return { success: false, message: 'Report not found.' };
    }

    if (report.postAuthorId === currentUser.id) {
        return { success: false, message: 'You cannot vote on a report for your own post.' };
    }

    if (report.reporterId === currentUser.id) {
        return { success: false, message: 'You cannot vote on a report you created.' };
    }

    const existingVote = await db.query.reportVotes.findFirst({
        where: and(
            eq(reportVotes.reportId, reportId),
            eq(reportVotes.voterId, currentUser.id)
        ),
    });

    if (existingVote) {
        return { success: false, message: 'You have already voted on this report.' };
    }
    
    try {
        await db.insert(reportVotes).values({
            reportId,
            voterId: currentUser.id,
        });

        const votes = await db.select({ count: count() }).from(reportVotes).where(eq(reportVotes.reportId, reportId));
        const voteCount = votes[0].count;
        
        if (voteCount >= 12) {
            await db.update(reportedPosts).set({ status: 'banned' }).where(eq(reportedPosts.id, reportId));
            await db.update(users).set({ isBanned: true }).where(eq(users.id, report.postAuthorId));
            revalidatePath('/community-review');
            return { success: true, message: 'Your vote has been recorded and the user has been banned.', banned: true };
        }
        
    } catch (error: any) {
        return { success: false, message: `Database Error: ${error.message || 'Failed to record vote.'}` };
    }

    revalidatePath('/community-review');
    return { success: true, message: 'Your vote has been recorded.' };
}

const submitExplanationSchema = z.object({
    reportId: z.string(),
    explanation: z.string().min(10, "Explanation must be at least 10 characters long.").max(500, "Explanation cannot exceed 500 characters."),
});

export async function submitAuthorExplanation(values: z.infer<typeof submitExplanationSchema>) {
    const validatedFields = submitExplanationSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.errors[0].message };
    }

    const { reportId, explanation } = validatedFields.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "You must be logged in." };
    }

    const report = await db.query.reportedPosts.findFirst({
        where: eq(reportedPosts.id, reportId),
    });

    if (!report) {
        return { success: false, message: "Report not found." };
    }

    if (report.postAuthorId !== currentUser.id) {
        return { success: false, message: "You are not the author of this post." };
    }

    if (report.authorExplanation) {
        return { success: false, message: "An explanation has already been submitted for this report." };
    }

    try {
        await db.update(reportedPosts).set({
            authorExplanation: explanation
        }).where(eq(reportedPosts.id, reportId));
    } catch (error: any) {
         return { success: false, message: `Database Error: ${error.message || 'Failed to submit explanation.'}` };
    }

    revalidatePath('/community-review');
    return { success: true, message: "Your explanation has been submitted." };
}

export async function deleteAccount() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to delete your account.' };
  }

  const isAuthorOfPending = await db.query.reportedPosts.findFirst({
    where: and(
      eq(reportedPosts.postAuthorId, currentUser.id),
      eq(reportedPosts.status, 'pending')
    )
  });

  if (isAuthorOfPending) {
    return { success: false, message: 'You cannot delete your account while you have a post under community review.' };
  }

  const isReporterOfPending = await db.query.reportedPosts.findFirst({
      where: and(
          eq(reportedPosts.reporterId, currentUser.id),
          eq(reportedPosts.status, 'pending')
      )
  });

  if (isReporterOfPending) {
      return { success: false, message: 'You cannot delete your account while a post you reported is under community review.' };
  }
  
  try {
    await db.delete(reportVotes).where(eq(reportVotes.voterId, currentUser.id));
    await db.delete(messages).where(eq(messages.senderId, currentUser.id));
    await db.delete(chatParticipants).where(eq(chatParticipants.userId, currentUser.id));
    await db.delete(posts).where(eq(posts.authorId, currentUser.id));
    await db.delete(topics).where(eq(topics.authorId, currentUser.id));
    await db.delete(users).where(eq(users.id, currentUser.id));

  } catch (error: any) {
    console.error('Delete account error:', error);
    return { success: false, message: 'An error occurred while deleting your account.' };
  }
  
  cookies().delete('session');
  redirect('/login');
}

export async function updateTopicsPerPage(topicsPerPage: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'You must be logged in.' };
  }

  const validValues = [10, 25, 50];
  if (!validValues.includes(topicsPerPage)) {
    return { success: false, message: 'Invalid value for topics per page.' };
  }

  try {
    await db.update(users)
      .set({ topicsPerPage: topicsPerPage })
      .where(eq(users.id, currentUser.id));
  } catch (error: any) {
    return { success: false, message: 'Failed to update settings.' };
  }

  revalidatePath('/topics');
  return { success: true };
}

export async function updatePollsPerPage(pollsPerPage: number) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in.' };
    }

    const validValues = [10, 25, 50];
    if (!validValues.includes(pollsPerPage)) {
        return { success: false, message: 'Invalid value for polls per page.' };
    }

    try {
        await db.update(users)
        .set({ pollsPerPage: pollsPerPage })
        .where(eq(users.id, currentUser.id));
    } catch (error: any) {
        return { success: false, message: 'Failed to update settings.' };
    }

    revalidatePath('/polls');
    return { success: true };
}

// --- POLL ACTIONS ---

const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long.').max(200),
  color: z.string().optional(),
  options: z.array(z.object({ text: z.string().min(1).max(50) })).min(2).max(5),
});

export async function createPoll(values: z.infer<typeof createPollSchema>): Promise<{ success: boolean, message?: string, newPoll?: Poll }> {
  const validatedFields = createPollSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.errors[0].message };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "You must be logged in to create a poll." };
  }

  try {
    await checkRateLimit(currentUser.id, ActionType.CREATE_POLL);
    
    const { question, color, options } = validatedFields.data;
    const pollId = randomUUID();
    const now = new Date();

    await db.insert(polls).values({
      id: pollId,
      question,
      color,
      authorId: currentUser.id,
      createdAt: now,
      lastActivityTimestamp: now,
    });

    await db.insert(pollOptions).values(
      options.map(opt => ({
        id: randomUUID(),
        pollId,
        text: opt.text,
      }))
    );
    
    const newPollData = await db.query.polls.findFirst({
        where: eq(polls.id, pollId),
        with: {
            author: true,
            options: {
                with: {
                    votes: true
                }
            }
        }
    });

    if (!newPollData) {
        return { success: false, message: "Could not retrieve newly created poll." };
    }
    
    const formattedPoll: Poll = {
        id: newPollData.id,
        question: newPollData.question,
        author: newPollData.author,
        createdAt: newPollData.createdAt,
        color: newPollData.color,
        options: newPollData.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            voteCount: 0,
        })),
        totalVotes: 0,
        userVote: null,
    };

    revalidatePath('/polls');
    return { success: true, newPoll: formattedPoll };
  } catch (error: any) {
    return { success: false, message: `${error.message || 'Failed to create poll.'}` };
  }
}

export async function castVote(pollId: string, optionId: string): Promise<{ success: boolean; message?: string, updatedPoll?: Poll }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "You must be logged in to vote." };
    }

    const existingVote = await db.query.pollVotes.findFirst({
        where: and(
            eq(pollVotes.pollId, pollId),
            eq(pollVotes.voterId, currentUser.id)
        )
    });

    if (existingVote) {
        return { success: false, message: "You have already voted on this poll." };
    }

    try {
        await db.insert(pollVotes).values({
            pollId,
            optionId,
            voterId: currentUser.id,
        });
        
        await db.update(polls).set({
            lastActivityTimestamp: new Date(),
        }).where(eq(polls.id, pollId));

        const updatedPollData = await db.query.polls.findFirst({
            where: eq(polls.id, pollId),
            with: {
                author: true,
                options: {
                    with: {
                        votes: true,
                    },
                },
            },
        });

        if (!updatedPollData) {
            return { success: false, message: "Could not retrieve updated poll data." };
        }

        const totalVotes = updatedPollData.options.reduce((sum, opt) => sum + opt.votes.length, 0);
        const formattedPoll: Poll = {
            id: updatedPollData.id,
            question: updatedPollData.question,
            author: updatedPollData.author,
            createdAt: updatedPollData.createdAt,
            color: updatedPollData.color,
            options: updatedPollData.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                voteCount: opt.votes.length,
            })),
            totalVotes,
            userVote: optionId,
        };

        revalidatePath('/polls');
        return { success: true, updatedPoll: formattedPoll };
    } catch (error: any) {
        return { success: false, message: `Database Error: ${error.message || 'Failed to cast vote.'}` };
    }
}

export async function reportPoll(pollId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to report a poll.' };
    }
    
    try {
        await checkRateLimit(currentUser.id, ActionType.REPORT_CONTENT);

        const pollToReport = await db.query.polls.findFirst({
            where: eq(polls.id, pollId),
        });

        if (!pollToReport) {
            return { success: false, message: 'Poll not found.' };
        }

        if (pollToReport.authorId === currentUser.id) {
            return { success: false, message: 'You cannot report your own poll.' };
        }

        const existingReport = await db.query.reportedPosts.findFirst({
            where: and(
                eq(reportedPosts.pollId, pollId),
                eq(reportedPosts.status, 'pending')
            ),
        });

        if (existingReport) {
            return { success: false, message: 'This poll has already been reported and is under review.' };
        }

        await db.insert(reportedPosts).values({
            id: randomUUID(),
            pollId,
            reporterId: currentUser.id,
            postContent: pollToReport.question,
            postAuthorId: pollToReport.authorId,
            status: 'pending',
        });
    } catch (error: any) {
        return { success: false, message: `${error.message || 'Failed to report poll.'}` };
    }
    
    revalidatePath('/polls');
    return { success: true, message: 'Poll reported successfully. It will be reviewed by the community.' };
}

const editPollSchema = z.object({
  pollId: z.string(),
  question: z.string().min(5).max(200),
  color: z.string().optional(),
});

export async function editPoll(values: z.infer<typeof editPollSchema>) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "You must be logged in." };
    }

    const poll = await db.query.polls.findFirst({ where: eq(polls.id, values.pollId) });
    if (!poll || poll.authorId !== currentUser.id) {
        return { success: false, message: "You are not authorized to edit this poll." };
    }
    
    const isUnderReview = await db.query.reportedPosts.findFirst({
        where: and(eq(reportedPosts.pollId, values.pollId), eq(reportedPosts.status, 'pending'))
    });

    if (isUnderReview) {
        return { success: false, message: "Cannot edit a poll that is under community review." };
    }

    try {
        await db.update(polls).set({
            question: values.question,
            color: values.color,
        }).where(eq(polls.id, values.pollId));
        revalidatePath('/polls');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: `Database Error: ${error.message}` };
    }
}

export async function deletePoll(pollId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "You must be logged in." };
    }
    
    const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) });
    if (!poll || poll.authorId !== currentUser.id) {
        return { success: false, message: "You are not authorized to delete this poll." };
    }

    const isUnderReview = await db.query.reportedPosts.findFirst({
        where: and(eq(reportedPosts.pollId, pollId), eq(reportedPosts.status, 'pending'))
    });

    if (isUnderReview) {
        return { success: false, message: "Cannot delete a poll that is under community review." };
    }

    try {
        await db.delete(pollVotes).where(eq(pollVotes.pollId, pollId));
        await db.delete(pollOptions).where(eq(pollOptions.pollId, pollId));
        await db.delete(polls).where(eq(polls.id, pollId));
        revalidatePath('/polls');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: `Database Error: ${error.message}` };
    }
}

export async function togglePwa(enabled: boolean) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'You must be logged in.' };
    }

    try {
        await db.update(users)
            .set({ isPwaEnabled: enabled })
            .where(eq(users.id, currentUser.id));
    } catch (error: any) {
        return { success: false, message: 'Failed to update PWA settings.' };
    }

    revalidatePath('/settings');
    return { success: true };
}
