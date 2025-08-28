ALTER TABLE "users" ADD COLUMN "last_seen_topics_timestamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_polls_timestamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_community_review_timestamp" timestamp DEFAULT now() NOT NULL;