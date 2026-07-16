import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  claims,
  ledgerEntries,
  ledgerTransactions,
  proofRequirements,
  submissionAnswers,
  submissions,
  users,
  walletAccounts,
} from "@/db/schema";
import { reconcileExpiredClaims } from "@/lib/services/claims";

export type EarnerTask = Awaited<ReturnType<typeof getEarnerTasks>>[number];

export async function getEarnerTasks(userId: string) {
  return await db.transaction(async (tx) => {
    const activeClaims = await tx
      .select({ campaignId: claims.campaignId })
      .from(claims)
      .where(and(eq(claims.earnerId, userId), eq(claims.status, "active")));

    for (const campaignId of [
      ...new Set(activeClaims.map((claim) => claim.campaignId)),
    ]) {
      await reconcileExpiredClaims(tx, campaignId, new Date());
    }

    const rows = await tx
      .select({
        claim: claims,
        campaign: campaigns,
        submission: submissions,
        businessName: users.name,
      })
      .from(claims)
      .innerJoin(campaigns, eq(campaigns.id, claims.campaignId))
      .innerJoin(users, eq(users.id, campaigns.ownerId))
      .leftJoin(submissions, eq(submissions.claimId, claims.id))
      .where(eq(claims.earnerId, userId))
      .orderBy(desc(claims.claimedAt));

    return rows;
  });
}

export async function getClaimWorkspace(claimId: string, userId: string) {
  return await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        claim: claims,
        campaign: campaigns,
        businessName: users.name,
      })
      .from(claims)
      .innerJoin(campaigns, eq(campaigns.id, claims.campaignId))
      .innerJoin(users, eq(users.id, campaigns.ownerId))
      .where(and(eq(claims.id, claimId), eq(claims.earnerId, userId)))
      .limit(1);

    if (!row) {
      return null;
    }

    if (row.claim.status === "active") {
      await reconcileExpiredClaims(tx, row.campaign.id, new Date());
      const [refreshedClaim] = await tx
        .select()
        .from(claims)
        .where(eq(claims.id, claimId))
        .limit(1);
      if (refreshedClaim) {
        row.claim = refreshedClaim;
      }
    }

    const [requirements, [submission]] = await Promise.all([
      tx
        .select()
        .from(proofRequirements)
        .where(eq(proofRequirements.campaignId, row.campaign.id))
        .orderBy(proofRequirements.sortOrder),
      tx
        .select()
        .from(submissions)
        .where(eq(submissions.claimId, row.claim.id))
        .limit(1),
    ]);

    const answers = submission
      ? await tx
          .select()
          .from(submissionAnswers)
          .where(eq(submissionAnswers.submissionId, submission.id))
      : [];

    return {
      ...row,
      requirements,
      submission: submission ?? null,
      answers,
    };
  });
}

export async function getEarningsHistory(userId: string) {
  const [account] = await db
    .select({ id: walletAccounts.id })
    .from(walletAccounts)
    .where(
      and(eq(walletAccounts.kind, "user"), eq(walletAccounts.userId, userId)),
    )
    .limit(1);

  if (!account) {
    return [];
  }

  return await db
    .select({
      id: ledgerTransactions.id,
      amountCents: ledgerEntries.amountCents,
      createdAt: ledgerTransactions.createdAt,
      campaignId: ledgerTransactions.campaignId,
      submissionId: ledgerTransactions.submissionId,
      campaignTitle: campaigns.title,
      campaignSlug: campaigns.slug,
    })
    .from(ledgerEntries)
    .innerJoin(
      ledgerTransactions,
      eq(ledgerTransactions.id, ledgerEntries.transactionId),
    )
    .leftJoin(campaigns, eq(campaigns.id, ledgerTransactions.campaignId))
    .where(
      and(
        eq(ledgerEntries.accountId, account.id),
        eq(ledgerTransactions.kind, "payout"),
      ),
    )
    .orderBy(desc(ledgerTransactions.createdAt));
}

export async function getClaimProofContext(
  claimId: string,
  userId: string,
) {
  const [claim] = await db
    .select()
    .from(claims)
    .where(and(eq(claims.id, claimId), eq(claims.earnerId, userId)))
    .limit(1);

  if (!claim) {
    return null;
  }

  const [requirements, submissionRows] = await Promise.all([
    db
      .select()
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, claim.campaignId))
      .orderBy(proofRequirements.sortOrder),
    db
      .select()
      .from(submissions)
      .where(eq(submissions.claimId, claim.id))
      .limit(1),
  ]);
  const submission = submissionRows[0] ?? null;
  const answers = submission
    ? await db
        .select()
        .from(submissionAnswers)
        .where(
          and(
            eq(submissionAnswers.submissionId, submission.id),
            inArray(
              submissionAnswers.proofRequirementId,
              requirements.map((requirement) => requirement.id),
            ),
          ),
        )
    : [];

  return { claim, requirements, submission, answers };
}
