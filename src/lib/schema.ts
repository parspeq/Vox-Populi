
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password'),
  avatar: text('avatar'),
  age: integer('age'),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  twoFactorSecret: text('two_factor_secret'),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').default(false).notNull(),
  twoFactorBackupCodes: jsonb('two_factor_backup_codes'),
  isBanned: boolean('is_banned').default(false).notNull(),
  topicsPerPage: integer('topics_per_page').default(10).notNull(),
  pollsPerPage: integer('polls_per_page').default(10).notNull(),
  failedLoginAttemptTimestamps: jsonb('failed_login_attempt_timestamps').default('[]').notNull(),
  lockoutUntil: timestamp('lockout_until'),
  lastSeenTopicsTimestamp: timestamp('last_seen_topics_timestamp').defaultNow().notNull(),
  lastSeenPollsTimestamp: timestamp('last_seen_polls_timestamp').defaultNow().notNull(),
  lastSeenCommunityReviewTimestamp: timestamp('last_seen_community_review_timestamp').defaultNow().notNull(),
  isPwaEnabled: boolean('is_pwa_enabled').default(false).notNull(),
});

export const rateLimitEvents = pgTable('rate_limit_events', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(), // This can be IP or client_id or user_id
  actionType: text('action_type'), // Added to distinguish different actions
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const topics = pgTable('topics', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  lastActivityTimestamp: timestamp('last_activity_timestamp').defaultNow().notNull(),
  replyCount: integer('reply_count').default(0),
});

export const posts = pgTable('posts', {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): any => posts.id, { onDelete: 'cascade' }),
    color: text('color'),
});

export const postAttachments = pgTable('post_attachments', {
    id: serial('id').primaryKey(),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
});

export const chats = pgTable('chats', {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    topicId: text('topic_id').references(() => topics.id, { onDelete: 'cascade' }).unique(),
});

export const chatParticipants = pgTable('chat_participants', {
    chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.chatId, t.userId] }),
}));


export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  color: text('color'),
});

// --- Polling Schema ---
export const polls = pgTable('polls', {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastActivityTimestamp: timestamp('last_activity_timestamp').defaultNow().notNull(),
    color: text('color'),
});

export const pollOptions = pgTable('poll_options', {
    id: text('id').primaryKey(),
    pollId: text('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
});

export const pollVotes = pgTable('poll_votes', {
    pollId: text('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
    optionId: text('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
    voterId: text('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.pollId, t.voterId] }), // A user can only vote once per poll
}));


// --- Moderation Schema ---
export const reportStatusEnum = pgEnum('report_status', ['pending', 'banned', 'appeal_pending', 'appeal_accepted', 'appeal_rejected']);

export const reportedPosts = pgTable('reported_posts', {
    id: text('id').primaryKey(),
    postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    pollId: text('poll_id').references(() => polls.id, { onDelete: 'set null' }),
    messageId: text('message_id').references(() => messages.id, { onDelete: 'set null' }), // Added for chat message reporting
    reporterId: text('reporter_id').references(() => users.id, { onDelete: 'set null' }),
    postContent: text('post_content').notNull(), // For posts, polls, and messages
    postAuthorId: text('post_author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: reportStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    authorExplanation: text('author_explanation'),
});

export const reportVotes = pgTable('report_votes', {
    reportId: text('report_id').notNull().references(() => reportedPosts.id, { onDelete: 'cascade' }),
    voterId: text('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.reportId, t.voterId] }),
}));


// --- Relations ---

export const usersRelations = relations(users, ({ one, many }) => ({
    topics: many(topics),
    posts: many(posts),
    polls: many(polls),
    pollVotes: many(pollVotes),
    chatParticipants: many(chatParticipants),
    reportedPosts: many(reportedPosts, { relationName: 'reported_by'}),
    reportsOfUserPosts: many(reportedPosts, { relationName: 'posts_of_user_reported'}),
    reportVotes: many(reportVotes),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
    author: one(users, {
        fields: [topics.authorId],
        references: [users.id],
    }),
    posts: many(posts),
    chat: one(chats, {
        fields: [topics.id],
        references: [chats.topicId],
    })
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
    topic: one(topics, {
        fields: [posts.topicId],
        references: [topics.id],
    }),
    parent: one(posts, {
        fields: [posts.parentId],
        references: [posts.id],
        relationName: 'replies',
    }),
    replies: many(posts, {
        relationName: 'replies',
    }),
    attachments: many(postAttachments),
    reports: many(reportedPosts),
}));

export const postAttachmentsRelations = relations(postAttachments, ({ one }) => ({
    post: one(posts, {
        fields: [postAttachments.postId],
        references: [posts.id],
    }),
}));

export const chatsRelations = relations(chats, ({ many, one }) => ({
    messages: many(messages),
    participants: many(chatParticipants),
    topic: one(topics, {
        fields: [chats.topicId],
        references: [chats.topicId],
    })
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
    chat: one(chats, {
        fields: [chatParticipants.chatId],
        references: [chats.id],
    }),
    user: one(users, {
        fields: [chatParticipants.userId],
        references: [users.id],
    }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    reports: many(reportedPosts),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
    author: one(users, {
        fields: [polls.authorId],
        references: [users.id],
    }),
    options: many(pollOptions),
    votes: many(pollVotes),
    reports: many(reportedPosts),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
    poll: one(polls, {
        fields: [pollOptions.pollId],
        references: [polls.id],
    }),
    votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
    poll: one(polls, {
        fields: [pollVotes.pollId],
        references: [polls.id],
    }),
    option: one(pollOptions, {
        fields: [pollVotes.optionId],
        references: [pollOptions.id],
    }),
    voter: one(users, {
        fields: [pollVotes.voterId],
        references: [users.id],
    }),
}));

export const reportedPostsRelations = relations(reportedPosts, ({ one, many }) => ({
    post: one(posts, {
        fields: [reportedPosts.postId],
        references: [posts.id],
    }),
    poll: one(polls, {
        fields: [reportedPosts.pollId],
        references: [polls.id],
    }),
    message: one(messages, {
        fields: [reportedPosts.messageId],
        references: [messages.id],
    }),
    reporter: one(users, {
        fields: [reportedPosts.reporterId],
        references: [users.id],
        relationName: 'reported_by',
    }),
    postAuthor: one(users, {
        fields: [reportedPosts.postAuthorId],
        references: [users.id],
        relationName: 'posts_of_user_reported'
    }),
    votes: many(reportVotes),
}));

export const reportVotesRelations = relations(reportVotes, ({ one }) => ({
    report: one(reportedPosts, {
        fields: [reportVotes.reportId],
        references: [reportedPosts.id],
    }),
    voter: one(users, {
        fields: [reportVotes.voterId],
        references: [users.id],
    }),
}));
