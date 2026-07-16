CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('active', 'submitted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ledger_transaction_kind" AS ENUM('demo_grant', 'escrow_reservation', 'payout', 'refund');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('claim_created', 'submission_received', 'changes_requested', 'submission_approved', 'submission_rejected', 'claim_expired', 'campaign_refunded');--> statement-breakpoint
CREATE TYPE "public"."proof_field_type" AS ENUM('short_text', 'long_text', 'url', 'file', 'image', 'confirmation');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'changes_requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."wallet_account_kind" AS ENUM('user', 'escrow', 'system');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"instructions" text NOT NULL,
	"reward_cents" integer NOT NULL,
	"slot_capacity" integer NOT NULL,
	"claim_window_hours" integer DEFAULT 24 NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_reward_positive" CHECK ("campaigns"."reward_cents" > 0),
	CONSTRAINT "campaigns_capacity_positive" CHECK ("campaigns"."slot_capacity" > 0),
	CONSTRAINT "campaigns_claim_window_positive" CHECK ("campaigns"."claim_window_hours" > 0),
	CONSTRAINT "campaigns_deadline_after_creation" CHECK ("campaigns"."deadline" > "campaigns"."created_at")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"earner_id" text NOT NULL,
	"status" "claim_status" DEFAULT 'active' NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_expiry_after_claim" CHECK ("claims"."expires_at" > "claims"."claimed_at")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"submission_id" uuid,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_size_positive" CHECK ("files"."size_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_nonzero" CHECK ("ledger_entries"."amount_cents" <> 0)
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "ledger_transaction_kind" NOT NULL,
	"idempotency_key" text NOT NULL,
	"actor_user_id" text,
	"campaign_id" uuid,
	"submission_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"campaign_id" uuid,
	"submission_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"field_type" "proof_field_type" NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proof_requirements_order_nonnegative" CHECK ("proof_requirements"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"proof_requirement_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"earner_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"review_feedback" text,
	"rejection_reason" text,
	"reviewer_id" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_version_positive" CHECK ("submissions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"handle" text,
	"avatar_url" text,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "wallet_account_kind" NOT NULL,
	"user_id" text,
	"campaign_id" uuid,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_owner_shape" CHECK ((
        ("wallet_accounts"."kind" = 'user' and "wallet_accounts"."user_id" is not null and "wallet_accounts"."campaign_id" is null)
        or ("wallet_accounts"."kind" = 'escrow' and "wallet_accounts"."user_id" is null and "wallet_accounts"."campaign_id" is not null)
        or ("wallet_accounts"."kind" = 'system' and "wallet_accounts"."user_id" is null and "wallet_accounts"."campaign_id" is null)
      ))
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_earner_id_users_id_fk" FOREIGN KEY ("earner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_requirements" ADD CONSTRAINT "proof_requirements_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_proof_requirement_id_proof_requirements_id_fk" FOREIGN KEY ("proof_requirement_id") REFERENCES "public"."proof_requirements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_earner_id_users_id_fk" FOREIGN KEY ("earner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_unique" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "campaigns_marketplace_idx" ON "campaigns" USING btree ("status","category","published_at");--> statement-breakpoint
CREATE INDEX "campaigns_owner_status_idx" ON "campaigns" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "claims_one_open_per_earner_campaign" ON "claims" USING btree ("campaign_id","earner_id") WHERE "claims"."status" in ('active', 'submitted');--> statement-breakpoint
CREATE INDEX "claims_campaign_capacity_idx" ON "claims" USING btree ("campaign_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "claims_earner_history_idx" ON "claims" USING btree ("earner_id","status","claimed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "files_storage_key_unique" ON "files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "files_submission_idx" ON "files" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_history_idx" ON "ledger_entries" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_transaction_idx" ON "ledger_entries" USING btree ("transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_transactions_idempotency_unique" ON "ledger_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_transactions_campaign_idx" ON "ledger_transactions" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_transactions_submission_idx" ON "ledger_transactions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_id","read_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_requirements_campaign_key_unique" ON "proof_requirements" USING btree ("campaign_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_requirements_campaign_order_unique" ON "proof_requirements" USING btree ("campaign_id","sort_order");--> statement-breakpoint
CREATE INDEX "proof_requirements_campaign_idx" ON "proof_requirements" USING btree ("campaign_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_answers_requirement_unique" ON "submission_answers" USING btree ("submission_id","proof_requirement_id");--> statement-breakpoint
CREATE INDEX "submission_answers_submission_idx" ON "submission_answers" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_claim_unique" ON "submissions" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "submissions_campaign_queue_idx" ON "submissions" USING btree ("campaign_id","status","submitted_at");--> statement-breakpoint
CREATE INDEX "submissions_earner_history_idx" ON "submissions" USING btree ("earner_id","status","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_unique" ON "users" USING btree ("handle") WHERE "users"."handle" is not null;--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_accounts_user_unique" ON "wallet_accounts" USING btree ("user_id") WHERE "wallet_accounts"."kind" = 'user';--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_accounts_campaign_unique" ON "wallet_accounts" USING btree ("campaign_id") WHERE "wallet_accounts"."kind" = 'escrow';--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_accounts_system_label_unique" ON "wallet_accounts" USING btree ("label") WHERE "wallet_accounts"."kind" = 'system';