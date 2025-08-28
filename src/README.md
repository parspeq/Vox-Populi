# Vox Populi

Vox Populi - Latin for "voice of the people" - is a platform where users directly manage content and govern their communities, serving as a direct public experiment in social democracy. Vox Populi is a modern discussion platform built for dynamic community interaction. It combines traditional threaded forums with real-time chat and empowers its users with a unique, community-driven moderation system.

## Key Features

- **Topic-Based Forums:** Users can create discussion topics, which serve as the foundation for threaded conversations.
- **Threaded & Colored Replies:** Engage in nested conversations. Users can color-code their posts and replies for personalization.
- **Rich Text Editor:** Editor for creating and editing content with a formatting toolbar for bold, italics, underline, colors, fonts, alignment, and more. It includes a live preview tab and a comprehensive help dialog.
- **Integrated Real-time Chat:** Every topic automatically spawns a dedicated real-time chat channel, allowing for both asynchronous and live discussions.
- **Community Polling:** Users can create and participate in polls with custom questions and multiple-choice options, featuring dynamic, real-time results to gauge community opinion.
- **Community-Driven Moderation:** A democratic approach to content moderation that covers posts, polls, and chat messages.
  - **Reporting:** Users can report content they deem inappropriate.
  - **Community Review:** Reported content enters a queue where eligible community members vote on the outcome.
  - **Author Appeals:** Authors of reported content have an opportunity to provide an explanation to the community.
- **Secure Authentication:** Features a complete authentication system with sign-up, login, and password reset flows. It includes robust security measures such as:
  - Two-Factor Authentication (2FA) with TOTP and backup codes.
  - Advanced anti-bot registration defenses (rate-limiting, honeypots, third-party validation).
  - Automatic account lockout after repeated failed login attempts.
- **User & Community Dashboards:** Provides pages for viewing overall platform statistics and personalized user contribution stats on the "My Statistics", "My Topics", and "My Polls" pages.
- **Customizable UI:** Includes a theme switcher with standard light/dark modes plus multiple high-contrast themes for accessibility. It also allows users to set personal preferences, such as the number of topics to display per page.
- **Optional Offline Mode (PWA):** Users can install the application on their device for offline access and faster loading. This feature can be enabled or disabled in the user settings.

## Getting Started

For a detailed guide on setting up a local development environment, please see the [**Installation Guide**](INSTALLATION.md).

To learn how to publish the application to a live server, refer to the [**Deployment Guide**](DEPLOYMENT.md).

## Tech Stack

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Generative AI:** Google AI & Genkit
- **Database:** PostgreSQL (managed by Neon)
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI
- **Authentication:** Bcryptjs and jose for password hashing and session management.

    