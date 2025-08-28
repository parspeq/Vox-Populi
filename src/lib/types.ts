
import { posts } from "./schema";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  lastSeen?: Date | null;
  createdAt: Date;
  posts: { id: string }[];
  topicsPerPage?: number | null;
  pollsPerPage?: number | null;
  lastSeenTopicsTimestamp: Date;
  lastSeenPollsTimestamp: Date;
  lastSeenCommunityReviewTimestamp: Date;
  isPwaEnabled?: boolean;
};

export type Reply = {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  attachments: string[];
  replies: Reply[];
  color?: string | null;
  isUnderReview?: boolean;
};

export type Topic = {
  id: string;
  title: string;
  author: User;
  timestamp: Date;
  lastActivityTimestamp?: Date | null;
  replyCount: number;
  initialPost: Reply;
};

export type Message = {
  id: string;
  chatId: string;
  content: string;
  timestamp: Date;
  sender: User;
  color?: string | null;
  isUnderReview?: boolean;
};

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
};

export type Post = typeof posts.$inferSelect;

export type PollOption = {
    id: string;
    text: string;
    voteCount: number;
};

export type Poll = {
    id: string;
    question: string;
    author: User;
    createdAt: Date;
    color: string | null;
    options: PollOption[];
    totalVotes: number;
    userVote: string | null; // optionId of the user's vote
    isUnderReview?: boolean;
};
