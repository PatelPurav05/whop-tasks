import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    handle: text("handle"),
    avatarUrl: text("avatar_url"),
    onboardingComplete: boolean("onboarding_complete")
      .default(false)
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_handle_unique")
      .on(table.handle)
      .where(sql`${table.handle} is not null`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);
export const proofFieldTypeEnum = pgEnum("proof_field_type", [
  "short_text",
  "long_text",
  "url",
  "file",
  "image",
  "confirmation",
]);
export const claimStatusEnum = pgEnum("claim_status", [
  "active",
  "submitted",
  "expired",
  "cancelled",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "changes_requested",
  "approved",
  "rejected",
]);
export const walletAccountKindEnum = pgEnum("wallet_account_kind", [
  "user",
  "escrow",
  "system",
]);
export const ledgerTransactionKindEnum = pgEnum("ledger_transaction_kind", [
  "demo_grant",
  "escrow_reservation",
  "payout",
  "refund",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "claim_created",
  "submission_received",
  "changes_requested",
  "submission_approved",
  "submission_rejected",
  "claim_expired",
  "campaign_refunded",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    instructions: text("instructions").notNull(),
    rewardCents: integer("reward_cents").notNull(),
    slotCapacity: integer("slot_capacity").notNull(),
    claimWindowHours: integer("claim_window_hours").default(24).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    status: campaignStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("campaigns_slug_unique").on(table.slug),
    index("campaigns_marketplace_idx").on(
      table.status,
      table.category,
      table.publishedAt,
    ),
    index("campaigns_owner_status_idx").on(table.ownerId, table.status),
    check("campaigns_reward_positive", sql`${table.rewardCents} > 0`),
    check("campaigns_capacity_positive", sql`${table.slotCapacity} > 0`),
    check(
      "campaigns_claim_window_positive",
      sql`${table.claimWindowHours} > 0`,
    ),
    check(
      "campaigns_deadline_after_creation",
      sql`${table.deadline} > ${table.createdAt}`,
    ),
  ],
);

export const proofRequirements = pgTable(
  "proof_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    helpText: text("help_text"),
    fieldType: proofFieldTypeEnum("field_type").notNull(),
    required: boolean("required").default(true).notNull(),
    sortOrder: integer("sort_order").notNull(),
    config: jsonb("config")
      .$type<{ maxLength?: number; acceptedMimeTypes?: string[] }>()
      .default({})
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("proof_requirements_campaign_key_unique").on(
      table.campaignId,
      table.key,
    ),
    uniqueIndex("proof_requirements_campaign_order_unique").on(
      table.campaignId,
      table.sortOrder,
    ),
    index("proof_requirements_campaign_idx").on(
      table.campaignId,
      table.sortOrder,
    ),
    check("proof_requirements_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "restrict" }),
    earnerId: text("earner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: claimStatusEnum("status").default("active").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("claims_one_open_per_earner_campaign")
      .on(table.campaignId, table.earnerId)
      .where(sql`${table.status} in ('active', 'submitted')`),
    index("claims_campaign_capacity_idx").on(
      table.campaignId,
      table.status,
      table.expiresAt,
    ),
    index("claims_earner_history_idx").on(
      table.earnerId,
      table.status,
      table.claimedAt,
    ),
    check("claims_expiry_after_claim", sql`${table.expiresAt} > ${table.claimedAt}`),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "restrict" }),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "restrict" }),
    earnerId: text("earner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").default(1).notNull(),
    status: submissionStatusEnum("status").default("pending").notNull(),
    reviewFeedback: text("review_feedback"),
    rejectionReason: text("rejection_reason"),
    reviewerId: text("reviewer_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("submissions_claim_unique").on(table.claimId),
    index("submissions_campaign_queue_idx").on(
      table.campaignId,
      table.status,
      table.submittedAt,
    ),
    index("submissions_earner_history_idx").on(
      table.earnerId,
      table.status,
      table.submittedAt,
    ),
    check("submissions_version_positive", sql`${table.version} > 0`),
  ],
);

export const submissionAnswers = pgTable(
  "submission_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    proofRequirementId: uuid("proof_requirement_id")
      .notNull()
      .references(() => proofRequirements.id, { onDelete: "restrict" }),
    value: jsonb("value").$type<JsonValue>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("submission_answers_requirement_unique").on(
      table.submissionId,
      table.proofRequirementId,
    ),
    index("submission_answers_submission_idx").on(table.submissionId),
  ],
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "cascade",
    }),
    storageKey: text("storage_key").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("files_storage_key_unique").on(table.storageKey),
    index("files_owner_idx").on(table.ownerId, table.createdAt),
    index("files_submission_idx").on(table.submissionId),
    check("files_size_positive", sql`${table.sizeBytes} > 0`),
  ],
);

export const walletAccounts = pgTable(
  "wallet_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: walletAccountKindEnum("kind").notNull(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
      onDelete: "restrict",
    }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("wallet_accounts_user_unique")
      .on(table.userId)
      .where(sql`${table.kind} = 'user'`),
    uniqueIndex("wallet_accounts_campaign_unique")
      .on(table.campaignId)
      .where(sql`${table.kind} = 'escrow'`),
    uniqueIndex("wallet_accounts_system_label_unique")
      .on(table.label)
      .where(sql`${table.kind} = 'system'`),
    check(
      "wallet_accounts_owner_shape",
      sql`(
        (${table.kind} = 'user' and ${table.userId} is not null and ${table.campaignId} is null)
        or (${table.kind} = 'escrow' and ${table.userId} is null and ${table.campaignId} is not null)
        or (${table.kind} = 'system' and ${table.userId} is null and ${table.campaignId} is null)
      )`,
    ),
  ],
);

export const ledgerTransactions = pgTable(
  "ledger_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: ledgerTransactionKindEnum("kind").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
      onDelete: "restrict",
    }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "restrict",
    }),
    metadata: jsonb("metadata").$type<Record<string, JsonValue>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ledger_transactions_idempotency_unique").on(
      table.idempotencyKey,
    ),
    index("ledger_transactions_campaign_idx").on(
      table.campaignId,
      table.createdAt,
    ),
    index("ledger_transactions_submission_idx").on(table.submissionId),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => ledgerTransactions.id, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => walletAccounts.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ledger_entries_account_history_idx").on(
      table.accountId,
      table.createdAt,
    ),
    index("ledger_entries_transaction_idx").on(table.transactionId),
    check("ledger_entries_nonzero", sql`${table.amountCents} <> 0`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
      onDelete: "cascade",
    }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "cascade",
    }),
    payload: jsonb("payload").$type<Record<string, JsonValue>>().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_recipient_unread_idx").on(
      table.recipientId,
      table.readAt,
      table.createdAt,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type ProofRequirement = typeof proofRequirements.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
