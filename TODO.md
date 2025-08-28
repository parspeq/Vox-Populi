# Project TODO

## Registration Flow

- [ ] Thoroughly test the new multi-tiered registration rate-limiting to ensure it functions as expected under various scenarios.
- [ ] Discuss and evaluate adding CAPTCHA validation (e.g., hCaptcha, reCAPTCHA) to the sign-up page to further mitigate bot-driven registrations.

## Code Quality & Testing

- [ ] Implement a unit testing strategy to improve application robustness.
  - [ ] Refactor business logic into pure, testable helper functions, separating it from environmental concerns (e.g., database calls, cookie access).
  - [X] **Candidate for refactoring 1: Rate Limiting.** Extract the rate-limiting logic from the `signUp` action into a dedicated helper function and write unit tests covering all "what if" scenarios.
  - [ ] **Candidate for refactoring 2: Voting Eligibility.** Extract the logic for checking if a user is eligible to vote from the `voteOnReport` action into a testable helper function.
  - [ ] **Candidate for refactoring 3: Client-side logic.** Explore extracting complex client-side filtering or data manipulation logic (e.g., in `topic-list.tsx`) into helper functions that can be unit tested.

## Architectural Improvements

- [X] **Centralized Rate Limiting Rules:** Extracted rate limit thresholds for user actions into a dedicated, easily modifiable configuration file at `src/config/rate-limits.ts`.
- [X] **Centralized Spam-Check Rules:** Extracted Stop Forum Spam thresholds (`MIN_FREQUENCY` and `MIN_CONFIDENCE`) into a dedicated configuration file at `src/config/spam-check.ts`.

    