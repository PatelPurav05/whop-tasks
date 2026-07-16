import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, test } from "vitest";
import { db, pool } from "@/db";
import {
  campaigns,
  claims,
  ledgerEntries,
  ledgerTransactions,
  proofRequirements,
  users,
  walletAccounts,
} from "@/db/schema";
import {
  archiveCampaign,
  createCampaign,
  publishCampaign,
} from "@/lib/services/campaigns";
import { claimCampaign } from "@/lib/services/claims";
import {
  getUserBalance,
  grantDemoCredits,
} from "@/lib/services/ledger";
import {
  reviewSubmission,
  submitProof,
} from "@/lib/services/submissions";

async function createTestUser(label: string): Promise<string> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    name: `Test ${label}`,
    email: `${label}-${id}@example.test`,
    emailVerified: true,
    onboardingComplete: true,
  });
  return id;
}

async function createPublishedCampaign(input: {
  ownerId: string;
  rewardCents: number;
  slotCapacity: number;
  proofRequirements?: Array<{
    key: string;
    label: string;
    fieldType:
      | "confirmation"
      | "file"
      | "image"
      | "long_text"
      | "short_text"
      | "url";
    required: boolean;
    config: { maxLength?: number; acceptedMimeTypes?: string[] };
  }>;
}) {
  const id = randomUUID();
  const campaign = await createCampaign(input.ownerId, {
    slug: `domain-test-${id}`,
    title: "Domain lifecycle campaign",
    description: "A deterministic campaign used to verify marketplace rules.",
    category: "QA testing",
    instructions: "Complete the structured proof and submit it for review.",
    rewardCents: input.rewardCents,
    slotCapacity: input.slotCapacity,
    claimWindowHours: 24,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
    proofRequirements: input.proofRequirements ?? [
      {
        key: "summary",
        label: "Summary",
        fieldType: "long_text",
        required: true,
        config: { maxLength: 500 },
      },
    ],
  });
  return await publishCampaign(campaign.id, input.ownerId);
}

describe("marketplace domain lifecycle", () => {
  test("expires claims before enforcing capacity and duplicate rules", async () => {
    const [ownerId, firstEarnerId, secondEarnerId] = await Promise.all([
      createTestUser("capacity-owner"),
      createTestUser("capacity-earner-a"),
      createTestUser("capacity-earner-b"),
    ]);
    await grantDemoCredits(ownerId, 5_000, randomUUID());
    const campaign = await createPublishedCampaign({
      ownerId,
      rewardCents: 1_000,
      slotCapacity: 1,
    });

    const firstClaim = await claimCampaign(campaign.id, firstEarnerId);
    await expect(claimCampaign(campaign.id, firstEarnerId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      claimCampaign(campaign.id, secondEarnerId),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const now = Date.now();
    await db
      .update(claims)
      .set({
        claimedAt: new Date(now - 2 * 60 * 60 * 1_000),
        expiresAt: new Date(now - 60 * 60 * 1_000),
      })
      .where(eq(claims.id, firstClaim.id));

    const replacement = await claimCampaign(campaign.id, secondEarnerId);
    expect(replacement.status).toBe("active");
    const [expired] = await db
      .select({ status: claims.status })
      .from(claims)
      .where(eq(claims.id, firstClaim.id));
    expect(expired?.status).toBe("expired");
  });

  test("validates structured proof and pays exactly once", async () => {
    const [ownerId, earnerId] = await Promise.all([
      createTestUser("approval-owner"),
      createTestUser("approval-earner"),
    ]);
    await grantDemoCredits(ownerId, 10_000, randomUUID());
    const ownerBefore = await getUserBalance(ownerId);
    const campaign = await createPublishedCampaign({
      ownerId,
      rewardCents: 1_250,
      slotCapacity: 1,
      proofRequirements: [
        {
          key: "summary",
          label: "Summary",
          fieldType: "long_text",
          required: true,
          config: { maxLength: 500 },
        },
        {
          key: "result_url",
          label: "Result URL",
          fieldType: "url",
          required: true,
          config: {},
        },
        {
          key: "confirmed",
          label: "Work confirmed",
          fieldType: "confirmation",
          required: true,
          config: {},
        },
      ],
    });
    expect(await getUserBalance(ownerId)).toBe(ownerBefore - 1_250);

    const claim = await claimCampaign(campaign.id, earnerId);
    const requirements = await db
      .select()
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, campaign.id))
      .orderBy(proofRequirements.sortOrder);

    await expect(
      submitProof(earnerId, {
        claimId: claim.id,
        answers: [
          { requirementId: requirements[0]!.id, value: "Complete" },
          { requirementId: requirements[1]!.id, value: "not-a-url" },
          { requirementId: requirements[2]!.id, value: true },
        ],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const submission = await submitProof(earnerId, {
      claimId: claim.id,
      answers: [
        {
          requirementId: requirements[0]!.id,
          value: "The requested work is complete with reproducible findings.",
        },
        {
          requirementId: requirements[1]!.id,
          value: "https://example.test/proof",
        },
        { requirementId: requirements[2]!.id, value: true },
      ],
    });

    const earnerBefore = await getUserBalance(earnerId);
    const approved = await reviewSubmission(ownerId, {
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "approve",
    });
    expect(approved.status).toBe("approved");
    expect(await getUserBalance(earnerId)).toBe(earnerBefore + 1_250);

    const approvedAgain = await reviewSubmission(ownerId, {
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "approve",
    });
    expect(approvedAgain.id).toBe(submission.id);
    expect(await getUserBalance(earnerId)).toBe(earnerBefore + 1_250);

    const [updatedCampaign] = await db
      .select({ status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaign.id));
    expect(updatedCampaign?.status).toBe("completed");

    const payouts = await db
      .select({ id: ledgerTransactions.id })
      .from(ledgerTransactions)
      .where(
        and(
          eq(ledgerTransactions.kind, "payout"),
          eq(ledgerTransactions.submissionId, submission.id),
        ),
      );
    expect(payouts).toHaveLength(1);

    const transactionTotals = await db
      .select({
        transactionId: ledgerEntries.transactionId,
        total: sql<number>`sum(${ledgerEntries.amountCents})`,
      })
      .from(ledgerEntries)
      .innerJoin(
        ledgerTransactions,
        eq(ledgerTransactions.id, ledgerEntries.transactionId),
      )
      .where(eq(ledgerTransactions.campaignId, campaign.id))
      .groupBy(ledgerEntries.transactionId);
    expect(transactionTotals.length).toBeGreaterThan(0);
    expect(transactionTotals.every((row) => Number(row.total) === 0)).toBe(
      true,
    );
  });

  test("refunds only unused escrow after approved work", async () => {
    const [ownerId, earnerId] = await Promise.all([
      createTestUser("refund-owner"),
      createTestUser("refund-earner"),
    ]);
    await grantDemoCredits(ownerId, 5_000, randomUUID());
    const ownerBefore = await getUserBalance(ownerId);
    const campaign = await createPublishedCampaign({
      ownerId,
      rewardCents: 700,
      slotCapacity: 2,
    });
    const claim = await claimCampaign(campaign.id, earnerId);
    const [requirement] = await db
      .select()
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, campaign.id));
    expect(requirement).toBeDefined();

    const submission = await submitProof(earnerId, {
      claimId: claim.id,
      answers: [{ requirementId: requirement!.id, value: "Complete" }],
    });
    await reviewSubmission(ownerId, {
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "approve",
    });
    await archiveCampaign(campaign.id, ownerId);

    expect(await getUserBalance(ownerId)).toBe(ownerBefore - 700);
    expect(await getUserBalance(earnerId)).toBe(700);

    const [escrow] = await db
      .select({ id: walletAccounts.id })
      .from(walletAccounts)
      .where(eq(walletAccounts.campaignId, campaign.id));
    const [escrowBalance] = await db
      .select({
        value: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, escrow!.id));
    expect(Number(escrowBalance?.value)).toBe(0);
  });
});

afterAll(async () => {
  await pool.end();
});
