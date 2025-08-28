/**
 * @fileOverview Centralized configuration for application rate limits.
 * This file defines the rules for various user actions to prevent spam and abuse.
 */

// ActionType enum defines consistent keys for different rate-limited actions.
export const ActionType = {
  // Specific actions that have their own, unique limits
  CREATE_TOPIC: 'create_topic',
  CREATE_REPLY: 'create_reply',
  CREATE_POLL: 'create_poll',
  REPORT_CONTENT: 'report_content',
  SEND_CHAT_MESSAGE: 'send_chat_message',

  // A generic action type used for global "burst" limits across multiple activities.
  ANY_CONTENT_CREATION: 'any_content_creation',
} as const;

export type RateLimitActivity = keyof typeof RATE_LIMITS;

// RATE_LIMITS is the main configuration object.
// Each key represents a user activity (e.g., creating a reply).
// The value is an array of rules that must all pass for the action to be allowed.
export const RATE_LIMITS = {
  // --- Activity: Replying to a post ---
  [ActionType.CREATE_REPLY]: [
    { limit: 5, window: 1, type: ActionType.ANY_CONTENT_CREATION },   // High-frequency burst limit: 5 actions per second
    { limit: 50, window: 3600, type: ActionType.CREATE_REPLY }, // Specific limit: 50 replies per hour
    { limit: 5, window: 60, type: ActionType.ANY_CONTENT_CREATION }, // Burst limit: 5 of any content type per minute
  ],

  // --- Activity: Creating a new topic ---
  [ActionType.CREATE_TOPIC]: [
    { limit: 5, window: 1, type: ActionType.ANY_CONTENT_CREATION },   // High-frequency burst limit: 5 actions per second
    { limit: 5, window: 3600, type: ActionType.CREATE_TOPIC }, // Specific limit: 5 topics per hour
    { limit: 5, window: 60, type: ActionType.ANY_CONTENT_CREATION }, // Burst limit
  ],

  // --- Activity: Creating a new poll ---
  [ActionType.CREATE_POLL]: [
    { limit: 5, window: 1, type: ActionType.ANY_CONTENT_CREATION },   // High-frequency burst limit: 5 actions per second
    { limit: 10, window: 86400, type: ActionType.CREATE_POLL }, // Specific limit: 10 polls per day
    { limit: 5, window: 60, type: ActionType.ANY_CONTENT_CREATION }, // Burst limit
  ],

  // --- Activity: Reporting any content ---
  [ActionType.REPORT_CONTENT]: [
    { limit: 5, window: 1, type: ActionType.ANY_CONTENT_CREATION },   // High-frequency burst limit: 5 actions per second
    { limit: 15, window: 3600, type: ActionType.REPORT_CONTENT }, // Specific limit: 15 reports per hour
    { limit: 5, window: 60, type: ActionType.ANY_CONTENT_CREATION }, // Burst limit
  ],
  
  // --- Activity: Sending a chat message ---
  [ActionType.SEND_CHAT_MESSAGE]: [
    { limit: 5, window: 1, type: ActionType.SEND_CHAT_MESSAGE },      // High-frequency burst limit: 5 messages per second
    { limit: 20, window: 60, type: ActionType.SEND_CHAT_MESSAGE },     // Sustained limit: 20 messages per minute
    { limit: 100, window: 3600, type: ActionType.SEND_CHAT_MESSAGE },  // Long-term limit: 100 messages per hour
  ],
};
