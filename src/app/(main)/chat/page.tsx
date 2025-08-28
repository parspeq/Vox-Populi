
import { ChatLayout } from '@/components/chat-layout';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/data';
import type { Chat, User } from '@/lib/types';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { chats, reportedPosts } from '@/lib/schema';

export default async function ChatPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    // This should not happen if middleware is set up correctly
    return null;
  }
  
  const dbChats = await db.query.chats.findMany({
    with: {
      messages: {
        with: {
          sender: true,
        },
        orderBy: (messages, { asc }) => [asc(messages.timestamp)],
        limit: 1, // Only need the last message for the preview
      },
    },
    orderBy: [desc(chats.name)],
  });

  const formattedChats: Chat[] = dbChats
    .map(chat => {
      if (!chat.name) return null;
      return {
        id: chat.id,
        name: chat.name,
        messages: chat.messages.map(m => ({
          id: m.id,
          content: m.content,
          timestamp: new Date(m.timestamp),
          sender: {
            id: m.sender.id,
            name: m.sender.name,
            email: m.sender.email,
            avatar: m.sender.avatar,
            createdAt: m.sender.createdAt,
            posts: [],
          },
        }))
      }
    })
    .filter((chat): chat is Chat => chat !== null);
    
  const allMessagesForLayout = await db.query.messages.findMany({
      with: {
          sender: true
      },
      orderBy: (messages, { asc }) => [asc(messages.timestamp)],
  });
  
  const messageIds = allMessagesForLayout.map(m => m.id);
  const reportedMessages = messageIds.length > 0 ? await db.query.reportedPosts.findMany({
    where: and(
      inArray(reportedPosts.messageId, messageIds),
      eq(reportedPosts.status, 'pending')
    ),
    columns: {
      messageId: true
    }
  }) : [];
  const reportedMessageIds = new Set(reportedMessages.map(r => r.messageId));

  const formattedMessages = allMessagesForLayout.map(m => ({
    ...m,
    timestamp: new Date(m.timestamp),
    isUnderReview: reportedMessageIds.has(m.id)
  }));

  return <ChatLayout chats={formattedChats} allMessages={formattedMessages} currentUser={currentUser} />;
}
