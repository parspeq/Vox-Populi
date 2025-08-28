
import { db } from '@/lib/db';
import { rateLimitEvents } from '@/lib/schema';
import { eq, or, and, gt, count } from 'drizzle-orm';
import { headers, cookies } from 'next/headers';
import { RATE_LIMITS, type RateLimitActivity } from '@/config/rate-limits';

/**
 * Checks and enforces rate limits for the sign-up process.
 * This function implements a multi-tiered strategy based on IP address and a client identifier cookie.
 * @returns {Promise<{success: boolean, message?: string}>} An object indicating if the request is allowed.
 */
export async function checkSignUpRateLimit(): Promise<{ success: boolean; message?: string }> {
    const ip = headers().get('x-forwarded-for') ?? 'unknown-ip';
    const clientId = cookies().get('client-id')?.value;

    if (!clientId) {
        return { success: false, message: 'Could not identify client. Please enable cookies and try again.' };
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch attempts for both IP and Client ID in one go
    const recentAttempts = await db
      .select({ identifier: rateLimitEvents.identifier, timestamp: rateLimitEvents.timestamp })
      .from(rateLimitEvents)
      .where(or(
          eq(rateLimitEvents.identifier, ip),
          eq(rateLimitEvents.identifier, clientId)
      ));

    // --- Tier 1: IP-based burst and hourly limiting ---
    const ipAttempts = recentAttempts.filter(a => a.identifier === ip);
    if (ipAttempts.filter(a => new Date(a.timestamp) > oneMinuteAgo).length > 5) {
        return { success: false, message: 'Too many requests from this network. Please try again in a minute.' };
    }
    if (ipAttempts.filter(a => new Date(a.timestamp) > oneHourAgo).length > 50) {
        return { success: false, message: 'Too many requests from this network. Please try again in an hour.' };
    }
    if (ipAttempts.filter(a => new Date(a.timestamp) > twentyFourHoursAgo).length > 100) {
        return { success: false, message: 'Daily registration limit for this network has been reached.' };
    }

    // --- Tier 2: Client ID-based daily and lifetime limiting ---
    const clientAttempts = recentAttempts.filter(a => a.identifier === clientId);
    if (clientAttempts.filter(a => new Date(a.timestamp) > twentyFourHoursAgo).length > 10) {
        return { success: false, message: 'You have exceeded the daily sign up limit for this device.' };
    }
    if (clientAttempts.length > 20) {
        return { success: false, message: 'This device has reached the maximum number of registration attempts.' };
    }
    
    // Record the new attempt if all checks pass
    try {
        await db.insert(rateLimitEvents).values([
            { identifier: ip, ipAddress: ip },
            { identifier: clientId, ipAddress: ip },
        ]);
    } catch (error) {
        console.error("Rate limit logging failed:", error);
        // Fail open: If we can't log, we still allow the request but log the error.
    }

    return { success: true };
}


/**
 * Checks and enforces rate limits for actions performed by authenticated users.
 * @param userId The ID of the user performing the action.
 * @param activity The type of activity being performed, used to look up rules in the config.
 * @returns {Promise<{success: boolean, message?: string}>} An object indicating if the request is allowed.
 * @throws An error if the rate limit is exceeded, which should be caught in the server action.
 */
export async function checkRateLimit(userId: string, activity: RateLimitActivity) {
    const rules = RATE_LIMITS[activity];
    if (!rules) return;

    const now = new Date();
    const actionTypesToLog: string[] = [];

    for (const rule of rules) {
        const windowStart = new Date(now.getTime() - rule.window * 1000);
        
        const [result] = await db.select({ value: count() })
            .from(rateLimitEvents)
            .where(and(
                eq(rateLimitEvents.identifier, userId),
                eq(rateLimitEvents.actionType, rule.type),
                gt(rateLimitEvents.timestamp, windowStart)
            ));

        if (result.value >= rule.limit) {
            const friendlyWindow = rule.window >= 3600 
                ? `${Math.round(rule.window / 3600)} hour(s)`
                : `${Math.round(rule.window / 60)} minute(s)`;
            throw new Error(`You are performing this action too frequently. Please try again in a while. (Limit: ${rule.limit} per ${friendlyWindow})`);
        }
        
        if (!actionTypesToLog.includes(rule.type)) {
            actionTypesToLog.push(rule.type);
        }
    }

    // If all checks pass, log the events
    const ip = headers().get('x-forwarded-for') ?? 'unknown-ip';
    try {
        await db.insert(rateLimitEvents).values(
            actionTypesToLog.map(type => ({
                identifier: userId,
                actionType: type,
                ipAddress: ip,
            }))
        );
    } catch (error) {
        console.error("Rate limit logging failed for user action:", error);
    }
}
