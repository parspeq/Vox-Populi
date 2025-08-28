/**
 * @fileOverview Centralized configuration for Stop Forum Spam checks.
 * This file defines the thresholds used to determine if a user's email
 * is associated with spam activity.
 */

export const SPAM_CHECK_CONFIG = {
  /**
   * The minimum number of times an email must appear in the spam database
   * before being considered a potential threat.
   */
  MIN_FREQUENCY: 10,

  /**
   * The minimum confidence score (as a percentage, 0-100) from the API
   * required to flag an email as spam.
   */
  MIN_CONFIDENCE: 75,
};
