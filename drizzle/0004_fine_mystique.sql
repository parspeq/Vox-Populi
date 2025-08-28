ALTER TABLE "reported_posts" ADD COLUMN "message_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reported_posts" ADD CONSTRAINT "reported_posts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
