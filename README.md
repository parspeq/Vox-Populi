# Vox Populi

Vox Populi - Latin for "voice of the people" - is a platform where users directly manage content and govern their communities, serving as a direct public experiment in social democracy. Vox Populi is a modern discussion platform built for dynamic community interaction. It combines traditional threaded forums with real-time chat and empowers its users with a unique, community-driven moderation system.

## Key Features

- **Topic-Based Forums:** Users can create discussion topics, which serve as the foundation for threaded conversations.
- **Threaded & Colored Replies:** Engage in nested conversations. Users can color-code their posts and replies for personalization.
- **Rich Text Editor:** Editor for creating and editing content with a formatting toolbar for bold, italics, underline, colors, fonts, alignment, and more. It includes a live preview tab and a comprehensive help dialog.
- **Integrated Real-time Chat:** Every topic automatically spawns a dedicated real-time chat channel, allowing for both asynchronous and live discussions.
- **Community Polling:** Users can create and participate in polls with custom questions and multiple-choice options, featuring dynamic, real-time results to gauge community opinion.
- **Community-Driven Moderation:** A democratic approach to content moderation.
  - **Reporting:** Users can report posts they deem inappropriate.
  - **Community Review:** Reported posts enter a queue where eligible community members vote on the outcome.
  - **Author Appeals:** Authors of reported content have an opportunity to provide an explanation to the community.
- **Secure Authentication:** Features a complete authentication system with sign-up, login, and password reset flows. It includes robust security measures such as:
  - Two-Factor Authentication (2FA) with TOTP and backup codes.
  - Advanced anti-bot registration defenses (rate-limiting, honeypots, third-party validation).
  - Automatic account lockout after repeated failed login attempts.
- **User & Community Dashboards:** Provides pages for viewing overall platform statistics and personalized user contribution stats.
- **Customizable UI:** Includes a theme switcher for light and dark modes and allows users to set personal preferences, such as the number of topics to display per page.

## Governance & Moderation Logic

**Vox Populi** operates on the principle of **subsidiarity**—the idea that matters should be handled by the smallest, least centralized competent authority: the users themselves.

### The Lifecycle of a Report
To prevent "mod-abuse" and ensure a transparent process, content moderation follows a democratic pipeline:

1.  **Flagging:** Any authenticated user can report a post they deem inappropriate.
2.  **The Community Queue:** Reported posts are automatically moved to a "Community Review" dashboard. They are not hidden immediately, ensuring the community can see what is being challenged.
3.  **The Author's Appeal:** Before a vote is finalized, the author is notified and given the opportunity to submit a brief explanatory statement. This statement is attached to the report for reviewers to read.
4.  **Democratic Verdict:** Eligible community members (based on account age or contribution stats) vote on the outcome:
    * ✅ **Keep:** The report is dismissed and the post remains.
    * ❌ **Remove:** The post is hidden, and the author's "Reputation Score" is adjusted.
5.  **Transparency:** All moderation actions are logged, creating a public record of how the community's "Voice" is being applied.

---

### 🛠️ Technical Implementation

* **Weighted Voting (Optional/Future):** Higher-contributing members can be given more weight in the moderation queue.
* **Rate-Limiting:** Robust anti-spam measures prevent a single user from flooding the review queue.
* **Threshold Logic:** Posts are only removed once a specific quorum or majority percentage is reached, preventing "minority silencing."

## Tech Stack

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI
- **Authentication:** Bcryptjs and jose for password hashing and session management.

## Getting Started
Review the documents in the docs folder to get started with Vox Populi.
