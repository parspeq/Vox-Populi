
'use server';

import { SPAM_CHECK_CONFIG } from '@/config/spam-check';

const GENERIC_ERROR_MESSAGE = "The email address provided is not valid or cannot be used. Please check for typos or try a different email.";
const NETWORK_ERROR_MESSAGE = "A network error occurred during email verification. Please try again in a few minutes.";

/**
 * Verifies if an email is technically valid and deliverable using an external API.
 * This is the first pass of email validation.
 * @param email The email address to verify.
 * @returns {Promise<{success: boolean, message?: string}>} An object indicating success and a message on failure.
 */
export async function verifyEmailWithApi(email: string): Promise<{ success: boolean, message?: string }> {
    const url = `https://rapid-email-verifier.fly.dev/api/validate?email=${encodeURIComponent(email)}`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (!response.ok) {
            console.error(`Email Verifier API failed with status: ${response.status}`);
            return { success: false, message: GENERIC_ERROR_MESSAGE };
        }

        const data = await response.json();

        const validations = data.validations;
        if (!validations) {
            return { success: false, message: GENERIC_ERROR_MESSAGE };
        }
        
        const isMailboxGood = validations.mailbox_exists === true;
        const isDisposable = validations.is_disposable === true;

        if (isMailboxGood && !isDisposable) {
            return { success: true };
        } else {
            return { success: false, message: GENERIC_ERROR_MESSAGE };
        }

    } catch (error: any) {
        if (error.name === 'TimeoutError' || error instanceof TypeError) {
             return { success: false, message: NETWORK_ERROR_MESSAGE };
        }
        console.error("Error during email verification API call:", error);
        return { success: false, message: GENERIC_ERROR_MESSAGE };
    }
}


/**
 * Checks an email against the Stop Forum Spam database.
 * This is the second pass of email validation.
 * @param email The email address to check.
 * @returns {Promise<{success: boolean, message?: string}>} An object indicating success and a message on failure.
 */
export async function checkStopForumSpam(email: string): Promise<{ success: boolean, message?: string }> {
    const url = `https://api.stopforumspam.org/api?email=${email}&json`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
            console.error(`Stop Forum Spam API failed with status: ${response.status}`);
            // Fail closed but with a specific network error message
            return { success: false, message: NETWORK_ERROR_MESSAGE };
        }
        const data = await response.json();

        if (data.success === 1 && data.email) {
            const { appears, frequency, confidence } = data.email;
            if (appears === 1 && (frequency > SPAM_CHECK_CONFIG.MIN_FREQUENCY || confidence > SPAM_CHECK_CONFIG.MIN_CONFIDENCE)) {
                return { success: false, message: GENERIC_ERROR_MESSAGE };
            }
        }
        return { success: true }; // Email is clean or not found
    } catch (error: any) {
        if (error.name === 'TimeoutError' || error instanceof TypeError) {
             return { success: false, message: NETWORK_ERROR_MESSAGE };
        }
        console.error("Error during Stop Forum Spam API call:", error);
        // Fail closed for any other unexpected errors
        return { success: false, message: GENERIC_ERROR_MESSAGE };
    }
}
