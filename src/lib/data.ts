
import 'server-only';

import { getSession } from './session';
import { db } from './db';
import { users, topics, posts, reportedPosts, polls, pollVotes } from './schema';
import { eq, sql, gte, count, gt, and, isNotNull, ne, desc, ilike } from 'drizzle-orm';
import type { Poll, Topic, User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const userId = session.user.userId;

  const userPromise = db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
        posts: {
            columns: {
                id: true
            }
        }
    }
  });

  const [userResult] = await Promise.allSettled([userPromise]);

  if (userResult.status === 'rejected' || !userResult.value) {
    return null;
  }
  
  const user = userResult.value;
  
  // Return a plain User object
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    posts: user.posts,
    topicsPerPage: user.topicsPerPage,
    pollsPerPage: user.pollsPerPage,
    lastSeenCommunityReviewTimestamp: user.lastSeenCommunityReviewTimestamp,
    lastSeenPollsTimestamp: user.lastSeenPollsTimestamp,
    lastSeenTopicsTimestamp: user.lastSeenTopicsTimestamp,
    isPwaEnabled: user.isPwaEnabled,
  };
}

export async function getLayoutData() {
    const user = await getCurrentUser();

    if (!user) {
        return { currentUser: null, notifications: {} };
    }
    
    // We don't need to wait for the user's last seen time to be updated
    db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, user.id)).catch(console.error);

    const [
        newTopicsResult,
        newRepliesResult,
        newPollsResult,
        newVotesResult,
        newReviewItemsResult
    ] = await Promise.all([
        // hasNewTopics: New topics created by OTHER users
        db.select({id: topics.id}).from(topics).where(and(
            gt(topics.timestamp, user.lastSeenTopicsTimestamp),
            ne(topics.authorId, user.id)
        )).limit(1),
        // hasNewRepliesToMyTopics
        db.select({pId: posts.id})
            .from(posts)
            .leftJoin(topics, eq(posts.topicId, topics.id))
            .where(and(
                gt(posts.timestamp, user.lastSeenTopicsTimestamp),
                eq(topics.authorId, user.id),
                isNotNull(posts.parentId),
                ne(posts.authorId, user.id)
            ))
            .limit(1),
        // hasNewPolls: New polls created by OTHER users
        db.select({id: polls.id}).from(polls).where(and(
            gt(polls.createdAt, user.lastSeenPollsTimestamp),
            ne(polls.authorId, user.id)
        )).limit(1),
        // hasNewVotesOnMyPolls
        db.select({voterId: pollVotes.voterId})
            .from(pollVotes)
            .leftJoin(polls, eq(pollVotes.pollId, polls.id))
            .where(and(
                eq(polls.authorId, user.id),
                ne(pollVotes.voterId, user.id)
            ))
            .limit(1),
        // hasNewCommunityReviewItems
        db.select({id: reportedPosts.id}).from(reportedPosts).where(gt(reportedPosts.createdAt, user.lastSeenCommunityReviewTimestamp)).limit(1),
    ]);

    const notifications = {
        hasNewTopics: newTopicsResult.length > 0,
        hasNewRepliesToMyTopics: newRepliesResult.length > 0,
        hasNewPolls: newPollsResult.length > 0,
        hasNewVotesOnMyPolls: newVotesResult.length > 0,
        hasNewCommunityReviewItems: newReviewItemsResult.length > 0,
    };

    return { currentUser: user, notifications };
}

export async function getStatistics() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsersResult,
    totalTopicsResult,
    newUsersResult,
    newPostsResult,
    totalReportedResult,
    newReportedResult,
    totalPollsResult,
    totalVotesResult,
    newPollsResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(topics),
    db.select({ value: count() }).from(users).where(gte(users.createdAt, twentyFourHoursAgo)),
    db.select({ value: count() }).from(posts).where(gte(posts.timestamp, twentyFourHoursAgo)),
    db.select({ value: count() }).from(reportedPosts),
    db.select({ value: count() }).from(reportedPosts).where(gte(reportedPosts.createdAt, twentyFourHoursAgo)),
    db.select({ value: count() }).from(polls),
    db.select({ value: count() }).from(pollVotes),
    db.select({ value: count() }).from(polls).where(gte(polls.createdAt, twentyFourHoursAgo)),
  ]);

  return {
    totalUsers: totalUsersResult[0].value,
    totalTopics: totalTopicsResult[0].value,
    newUsersLast24h: newUsersResult[0].value,
    newPostsLast24h: newPostsResult[0].value,
    totalReportedPosts: totalReportedResult[0].value,
    newReportedPostsLast24h: newReportedResult[0].value,
    totalPolls: totalPollsResult[0].value,
    totalVotes: totalVotesResult[0].value,
    newPollsLast24h: newPollsResult[0].value,
  };
}

export async function getUserStatistics(userId: string) {
  const [
    totalPostsResult,
    totalReportsMadeResult,
    totalReportsReceivedResult,
    totalPollsCreatedResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(posts).where(eq(posts.authorId, userId)),
    db.select({ value: count() }).from(reportedPosts).where(eq(reportedPosts.reporterId, userId)),
    db.select({ value: count() }).from(reportedPosts).where(eq(reportedPosts.postAuthorId, userId)),
    db.select({ value: count() }).from(polls).where(eq(polls.authorId, userId)),
  ]);

  return {
    totalPosts: totalPostsResult[0].value,
    totalReportsMade: totalReportsMadeResult[0].value,
    totalReportsReceived: totalReportsReceivedResult[0].value,
    totalPollsCreated: totalPollsCreatedResult[0].value,
  };
}

interface GetPollsOptions {
    currentUser: User;
    page: number;
    searchQuery?: string;
    authorId?: string;
}

export async function getPolls({ currentUser, page, searchQuery, authorId }: GetPollsOptions) {
    const pollsPerPage = currentUser.pollsPerPage ?? 10;
    const offset = (page - 1) * pollsPerPage;

    const searchFilter = searchQuery ? ilike(polls.question, `%${searchQuery}%`) : undefined;
    const authorFilter = authorId ? eq(polls.authorId, authorId) : undefined;
    
    const whereClause = and(searchFilter, authorFilter);

    const dbPollsPromise = db.query.polls.findMany({
        where: whereClause,
        with: {
            author: true,
            options: {
                with: {
                    votes: true,
                },
            },
            reports: {
                where: eq(reportedPosts.status, 'pending'),
                columns: {
                    pollId: true
                }
            },
            votes: {
                where: eq(pollVotes.voterId, currentUser.id)
            }
        },
        orderBy: [desc(polls.lastActivityTimestamp)],
        limit: pollsPerPage,
        offset: offset,
    });
    
    const totalPollsPromise = db.select({ count: sql`count(*)` }).from(polls).where(whereClause).then(res => res[0].count);

    const [dbPolls, totalPolls] = await Promise.all([dbPollsPromise, totalPollsPromise]);

    const userVoteMap = new Map(dbPolls.flatMap(p => p.votes).map(v => [v.pollId, v.optionId]));

    const formattedPolls: Poll[] = dbPolls.map(poll => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
        return {
            id: poll.id,
            question: poll.question,
            author: poll.author,
            createdAt: poll.createdAt,
            color: poll.color,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                voteCount: opt.votes.length,
            })),
            totalVotes,
            userVote: userVoteMap.get(poll.id) || null,
            isUnderReview: poll.reports.length > 0,
        };
    });

    const totalPages = Math.ceil(Number(totalPolls) / pollsPerPage);

    return { polls: formattedPolls, totalPages };
}

interface GetTopicsOptions {
    currentUser: User;
    page: number;
    searchQuery?: string;
    authorId?: string;
}

export async function getTopics({ currentUser, page, searchQuery, authorId }: GetTopicsOptions) {
    const topicsPerPage = currentUser.topicsPerPage ?? 10;
    const offset = (page - 1) * topicsPerPage;

    const searchFilter = searchQuery ? ilike(topics.title, `%${searchQuery}%`) : undefined;
    const authorFilter = authorId ? eq(topics.authorId, authorId) : undefined;
    const whereClause = and(authorFilter, searchFilter);

    const dbTopicsPromise = db.query.topics.findMany({
        where: whereClause,
        with: {
        author: true,
        posts: {
            orderBy: (posts, { asc }) => [asc(posts.timestamp)],
            limit: 1,
        },
        },
        orderBy: [desc(topics.lastActivityTimestamp)],
        limit: topicsPerPage,
        offset: offset,
    });
    
    const totalTopicsPromise = db.select({ count: sql`count(*)` }).from(topics).where(whereClause).then(res => res[0].count);

    const [dbTopics, totalTopics] = await Promise.all([dbTopicsPromise, totalTopicsPromise]);
    
    const totalPages = Math.ceil(Number(totalTopics) / topicsPerPage);

    const formattedTopics: Topic[] = dbTopics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        author: topic.author,
        timestamp: topic.timestamp,
        lastActivityTimestamp: topic.lastActivityTimestamp,
        replyCount: topic.replyCount ?? 0,
        initialPost: {
        id: topic.posts[0]?.id || '',
        author: topic.author,
        content: topic.posts[0]?.content || '',
        timestamp: topic.posts[0]?.timestamp.toLocaleString() || '',
        attachments: [], 
        replies: [],
        },
    }));

    return { topics: formattedTopics, totalPages };
}
