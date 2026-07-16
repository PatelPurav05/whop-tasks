import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  claims,
  proofRequirements,
  submissions,
  users,
  type Campaign,
  type Claim,
  type ProofRequirement,
  type Submission,
  type User,
} from "@/db/schema";
import {
  createCampaign,
  publishCampaign,
} from "@/lib/services/campaigns";
import { claimCampaign } from "@/lib/services/claims";
import { grantDemoCredits } from "@/lib/services/ledger";
import {
  reviewSubmission,
  submitProof,
} from "@/lib/services/submissions";
import type {
  ProofRequirementInput,
  SubmissionAnswerInput,
} from "@/lib/services/validation";
import { seedAuth } from "./seed-auth";

const DEMO_PASSWORD = "WhopTasksDemo!2026";
const DEMO_CREDIT_CENTS = 100_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

const demoAccounts = {
  maya: {
    name: "Maya Chen",
    email: "maya@whoptasks.local",
    handle: "maya-builds",
  },
  jordan: {
    name: "Jordan Ellis",
    email: "jordan@whoptasks.local",
    handle: "jordan-creates",
  },
} as const;

type DemoAccountKey = keyof typeof demoAccounts;
type DemoState =
  | "empty"
  | "nearly_full"
  | "pending"
  | "changes_requested"
  | "completed";

type CampaignSeed = {
  owner: DemoAccountKey;
  earner: DemoAccountKey;
  state: DemoState;
  slug: string;
  title: string;
  description: string;
  category: string;
  instructions: string;
  rewardCents: number;
  slotCapacity: number;
  claimWindowHours: number;
  deadlineDays: number;
  proofRequirements: ProofRequirementInput[];
};

const campaignSeeds = [
  {
    owner: "maya",
    earner: "jordan",
    state: "empty",
    slug: "review-creator-onboarding",
    title: "Review our creator onboarding flow",
    description:
      "Complete a focused usability pass and explain where a first-time creator might hesitate or abandon setup.",
    category: "User research",
    instructions:
      "Open the prototype, complete every onboarding step, and report the three clearest opportunities to reduce confusion.",
    rewardCents: 1_800,
    slotCapacity: 4,
    claimWindowHours: 24,
    deadlineDays: 45,
    proofRequirements: [
      {
        key: "first_impression",
        label: "What was your first impression?",
        helpText: "Share what felt immediately clear or unclear.",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 1_200 },
      },
      {
        key: "friction_screenshot",
        label: "Upload a screenshot of the biggest friction point",
        fieldType: "image",
        required: true,
        config: { acceptedMimeTypes: ["image/png", "image/jpeg"] },
      },
      {
        key: "completed_flow",
        label: "I completed the entire onboarding flow",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "maya",
    earner: "jordan",
    state: "nearly_full",
    slug: "test-mobile-checkout-safari",
    title: "Test mobile checkout in Safari",
    description:
      "Run a checkout quality pass on iPhone Safari and document any confusing, broken, or slow interaction.",
    category: "QA testing",
    instructions:
      "Use Safari on an iPhone-sized viewport, attempt checkout with the test card, and record reproducible observations.",
    rewardCents: 2_500,
    slotCapacity: 2,
    claimWindowHours: 168,
    deadlineDays: 30,
    proofRequirements: [
      {
        key: "device",
        label: "Device and iOS version",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 120 },
      },
      {
        key: "test_notes",
        label: "Test notes and reproduction steps",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 2_000 },
      },
      {
        key: "test_completed",
        label: "I tested through the final confirmation step",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "maya",
    earner: "jordan",
    state: "changes_requested",
    slug: "film-product-walkthrough",
    title: "Film a 45-second product walkthrough",
    description:
      "Create a concise vertical walkthrough that introduces the product, demonstrates one workflow, and ends with a direct call to action.",
    category: "Content",
    instructions:
      "Record a vertical draft, keep the pace conversational, avoid copyrighted audio, and provide a review link.",
    rewardCents: 3_500,
    slotCapacity: 3,
    claimWindowHours: 48,
    deadlineDays: 40,
    proofRequirements: [
      {
        key: "video_url",
        label: "Private video review link",
        fieldType: "url",
        required: true,
        config: {},
      },
      {
        key: "hook",
        label: "Opening hook used",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 180 },
      },
      {
        key: "original_work",
        label: "I created this work and used no copyrighted audio",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "maya",
    earner: "jordan",
    state: "completed",
    slug: "research-ecommerce-leads",
    title: "Research 10 ecommerce brand leads",
    description:
      "Find ten qualified ecommerce brands that match the target profile and provide concise, verifiable research for outreach.",
    category: "Sales research",
    instructions:
      "Prioritize US brands with active social accounts, verify each company website, and summarize why every lead is a fit.",
    rewardCents: 4_500,
    slotCapacity: 1,
    claimWindowHours: 48,
    deadlineDays: 35,
    proofRequirements: [
      {
        key: "sheet_url",
        label: "Research spreadsheet link",
        fieldType: "url",
        required: true,
        config: {},
      },
      {
        key: "method",
        label: "How did you qualify the leads?",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 1_000 },
      },
      {
        key: "verified",
        label: "I manually verified all ten leads",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "maya",
    earner: "jordan",
    state: "pending",
    slug: "moderate-community-launch",
    title: "Moderate a community launch hour",
    description:
      "Support a busy launch window by welcoming new members, routing questions, and collecting recurring points of confusion.",
    category: "Community",
    instructions:
      "Join ten minutes early, follow the response guide, avoid making product promises, and submit a concise shift recap.",
    rewardCents: 2_200,
    slotCapacity: 3,
    claimWindowHours: 24,
    deadlineDays: 28,
    proofRequirements: [
      {
        key: "shift_recap",
        label: "Shift recap",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 1_500 },
      },
      {
        key: "threads_handled",
        label: "Number of member threads handled",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 20 },
      },
      {
        key: "guidelines_followed",
        label: "I followed the community response guide",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "jordan",
    earner: "maya",
    state: "empty",
    slug: "interview-new-newsletter-readers",
    title: "Interview new newsletter readers",
    description:
      "Conduct a short reader interview to understand what prompted signup and which future topics would create the most value.",
    category: "User research",
    instructions:
      "Run a 15-minute call using the supplied guide, ask neutral follow-ups, and remove personal details from your notes.",
    rewardCents: 2_000,
    slotCapacity: 4,
    claimWindowHours: 24,
    deadlineDays: 50,
    proofRequirements: [
      {
        key: "interview_notes",
        label: "Anonymized interview notes",
        fieldType: "file",
        required: true,
        config: { acceptedMimeTypes: ["application/pdf", "text/plain"] },
      },
      {
        key: "key_insight",
        label: "Most useful insight",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 800 },
      },
      {
        key: "consent",
        label: "The participant consented to this research",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "jordan",
    earner: "maya",
    state: "nearly_full",
    slug: "audit-landing-page-links",
    title: "Audit every landing page link",
    description:
      "Check the launch landing page for broken destinations, incorrect tracking parameters, and unexpected new-tab behavior.",
    category: "QA testing",
    instructions:
      "Test every visible link on desktop and mobile widths, then report the destination, result, and reproduction details.",
    rewardCents: 1_600,
    slotCapacity: 2,
    claimWindowHours: 168,
    deadlineDays: 25,
    proofRequirements: [
      {
        key: "browser",
        label: "Browser and viewport tested",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 120 },
      },
      {
        key: "audit_notes",
        label: "Link audit notes",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 2_000 },
      },
      {
        key: "all_links_checked",
        label: "I checked every visible link",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "jordan",
    earner: "maya",
    state: "changes_requested",
    slug: "write-community-launch-post",
    title: "Write a community launch post",
    description:
      "Draft an energetic community announcement that explains the launch value, sets expectations, and invites a specific response.",
    category: "Content",
    instructions:
      "Write 150 to 220 words in a direct, welcoming voice and avoid hype, vague claims, or excessive emoji.",
    rewardCents: 2_800,
    slotCapacity: 3,
    claimWindowHours: 36,
    deadlineDays: 32,
    proofRequirements: [
      {
        key: "draft",
        label: "Launch post draft",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 1_500 },
      },
      {
        key: "cta",
        label: "Primary call to action",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 160 },
      },
      {
        key: "word_count",
        label: "The draft is between 150 and 220 words",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "jordan",
    earner: "maya",
    state: "completed",
    slug: "map-partner-prospects",
    title: "Map 12 partner prospects",
    description:
      "Build a concise partner prospect list with audience overlap, collaboration rationale, and a verified contact path.",
    category: "Sales research",
    instructions:
      "Focus on complementary creator tools, confirm each prospect is active, and include a tailored partnership angle.",
    rewardCents: 5_000,
    slotCapacity: 1,
    claimWindowHours: 48,
    deadlineDays: 38,
    proofRequirements: [
      {
        key: "prospect_list",
        label: "Prospect list URL",
        fieldType: "url",
        required: true,
        config: {},
      },
      {
        key: "best_fit",
        label: "Which prospect is the best fit and why?",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 900 },
      },
      {
        key: "contacts_verified",
        label: "I verified every contact path",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
  {
    owner: "jordan",
    earner: "maya",
    state: "pending",
    slug: "summarize-member-feedback",
    title: "Summarize member feedback themes",
    description:
      "Turn a set of anonymized support comments into a useful summary of recurring themes, urgency, and suggested next steps.",
    category: "Community",
    instructions:
      "Group similar comments, distinguish frequency from severity, and provide a short recommendation for the top three themes.",
    rewardCents: 1_900,
    slotCapacity: 3,
    claimWindowHours: 24,
    deadlineDays: 26,
    proofRequirements: [
      {
        key: "summary",
        label: "Feedback theme summary",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 1_800 },
      },
      {
        key: "top_theme",
        label: "Highest-priority theme",
        fieldType: "short_text",
        required: true,
        config: { maxLength: 180 },
      },
      {
        key: "anonymized",
        label: "I removed all personal member details",
        fieldType: "confirmation",
        required: true,
        config: {},
      },
    ],
  },
] satisfies readonly CampaignSeed[];

function assertLocalDemoEnvironment(): void {
  if (process.env.DEMO_SEED_ALLOWED === "true") {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The demo seed is disabled in production unless DEMO_SEED_ALLOWED=true",
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const parsed = new URL(databaseUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(parsed.hostname)) {
    throw new Error(
      `Refusing to seed non-local database host "${parsed.hostname}" unless DEMO_SEED_ALLOWED=true`,
    );
  }
}

async function ensureDemoUser(
  account: (typeof demoAccounts)[DemoAccountKey],
): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, account.email))
    .limit(1);

  let userId = existing?.id;
  if (!userId) {
    const result = await seedAuth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: DEMO_PASSWORD,
      },
    });
    userId = result.user.id;
  }

  const [user] = await db
    .update(users)
    .set({
      name: account.name,
      emailVerified: true,
      handle: account.handle,
      onboardingComplete: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!user) {
    throw new Error(`Could not prepare demo user ${account.email}`);
  }
  return user;
}

function deadlineFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

async function ensureCampaign(
  seed: CampaignSeed,
  ownerId: string,
): Promise<Campaign> {
  const [existing] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, seed.slug))
    .limit(1);

  let campaign = existing;
  if (!campaign) {
    campaign = await createCampaign(ownerId, {
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      instructions: seed.instructions,
      rewardCents: seed.rewardCents,
      slotCapacity: seed.slotCapacity,
      claimWindowHours: seed.claimWindowHours,
      deadline: deadlineFromNow(seed.deadlineDays),
      proofRequirements: seed.proofRequirements,
    });
  }

  if (campaign.ownerId !== ownerId) {
    throw new Error(`Seed slug "${seed.slug}" belongs to another user`);
  }

  if (campaign.status === "draft") {
    campaign = await publishCampaign(campaign.id, ownerId);
  }

  if (
    campaign.status !== "active" &&
    !(seed.state === "completed" && campaign.status === "completed")
  ) {
    throw new Error(
      `Seed campaign "${seed.slug}" has unexpected status "${campaign.status}"`,
    );
  }

  return campaign;
}

async function ensureOpenClaim(
  campaign: Campaign,
  earnerId: string,
): Promise<Claim> {
  const [existing] = await db
    .select()
    .from(claims)
    .where(
      and(
        eq(claims.campaignId, campaign.id),
        eq(claims.earnerId, earnerId),
        inArray(claims.status, ["active", "submitted"]),
      ),
    )
    .orderBy(desc(claims.claimedAt))
    .limit(1);

  if (
    existing &&
    (existing.status === "submitted" || existing.expiresAt > new Date())
  ) {
    return existing;
  }
  return await claimCampaign(campaign.id, earnerId);
}

function answerForRequirement(
  campaign: Campaign,
  requirement: ProofRequirement,
): SubmissionAnswerInput {
  let value: string | boolean;

  switch (requirement.fieldType) {
    case "confirmation":
      value = true;
      break;
    case "url":
      value = `https://example.com/proof/${campaign.slug}`;
      break;
    case "short_text":
      value = "Submission proof";
      break;
    case "long_text":
      value = `Proof for ${campaign.title}. The work follows the brief, documents the main findings, and includes clear next steps for review.`;
      break;
    case "file":
    case "image":
      throw new Error(
        `Seeded submission "${campaign.slug}" cannot require a local file`,
      );
  }

  return {
    requirementId: requirement.id,
    value,
  };
}

async function ensureSubmission(
  campaign: Campaign,
  earnerId: string,
): Promise<Submission> {
  const [existing] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.campaignId, campaign.id),
        eq(submissions.earnerId, earnerId),
      ),
    )
    .orderBy(desc(submissions.submittedAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  const claim = await ensureOpenClaim(campaign, earnerId);
  if (claim.status !== "active") {
    throw new Error(
      `Claim for "${campaign.slug}" is submitted without a submission`,
    );
  }

  const requirements = await db
    .select()
    .from(proofRequirements)
    .where(eq(proofRequirements.campaignId, campaign.id))
    .orderBy(proofRequirements.sortOrder);

  return await submitProof(earnerId, {
    claimId: claim.id,
    answers: requirements.map((requirement) =>
      answerForRequirement(campaign, requirement),
    ),
  });
}

async function ensureCampaignState(
  seed: CampaignSeed,
  campaign: Campaign,
  ownerId: string,
  earnerId: string,
): Promise<void> {
  if (seed.state === "empty") {
    return;
  }

  if (seed.state === "nearly_full") {
    await ensureOpenClaim(campaign, earnerId);
    return;
  }

  const submission = await ensureSubmission(campaign, earnerId);

  if (seed.state === "pending") {
    if (submission.status !== "pending") {
      throw new Error(
        `Seed submission for "${seed.slug}" should be pending, not "${submission.status}"`,
      );
    }
    return;
  }

  if (seed.state === "changes_requested") {
    if (submission.status === "pending") {
      await reviewSubmission(ownerId, {
        submissionId: submission.id,
        expectedVersion: submission.version,
        decision: "request_changes",
        feedback:
          "Strong start. Please add one concrete example and make the final recommendation more specific before resubmitting.",
      });
      return;
    }
    if (submission.status !== "changes_requested") {
      throw new Error(
        `Seed submission for "${seed.slug}" should await changes, not "${submission.status}"`,
      );
    }
    return;
  }

  if (submission.status === "pending") {
    await reviewSubmission(ownerId, {
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "approve",
    });
    return;
  }
  if (submission.status !== "approved") {
    throw new Error(
      `Seed submission for "${seed.slug}" should be approved, not "${submission.status}"`,
    );
  }
}

export async function runDemoSeed(): Promise<void> {
  assertLocalDemoEnvironment();
  console.log("Seeding Whop Tasks demo data...");

  const entries = await Promise.all(
    Object.entries(demoAccounts).map(async ([key, account]) => {
      const user = await ensureDemoUser(account);
      await grantDemoCredits(user.id, DEMO_CREDIT_CENTS, `local-demo:${key}`);
      return [key as DemoAccountKey, user] as const;
    }),
  );
  const accountUsers = Object.fromEntries(entries) as Record<
    DemoAccountKey,
    User
  >;

  for (const seed of campaignSeeds) {
    const owner = accountUsers[seed.owner];
    const earner = accountUsers[seed.earner];
    const campaign = await ensureCampaign(seed, owner.id);
    await ensureCampaignState(seed, campaign, owner.id, earner.id);
    console.log(`  ${seed.state.padEnd(17)} ${seed.slug}`);
  }

  console.log("\nDemo seed complete. Local-only credentials:");
  for (const account of Object.values(demoAccounts)) {
    console.log(`  ${account.email} / ${DEMO_PASSWORD}`);
  }
  console.log("Both accounts can switch between Earn and Business workspaces.");
  console.log("All wallet balances and payouts are simulated demo credits.");
}
