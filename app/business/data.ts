import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  claims,
  files as proofFiles,
  ledgerEntries,
  ledgerTransactions,
  proofRequirements,
  submissionAnswers,
  submissions,
  users,
  walletAccounts,
} from "@/db/schema";
import { getUserBalance } from "@/lib/services/ledger";
import type {
  BusinessCampaignDetail,
  BusinessCampaignSummary,
  BusinessDashboardData,
  SubmissionReviewDetail,
  WalletHistoryItem,
} from "@/components/business/types";

async function getOwnedEscrowBalance(ownerId: string): Promise<number> {
  const [row] = await db
    .select({
      balance: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)`,
    })
    .from(ledgerEntries)
    .innerJoin(
      walletAccounts,
      eq(walletAccounts.id, ledgerEntries.accountId),
    )
    .innerJoin(campaigns, eq(campaigns.id, walletAccounts.campaignId))
    .where(
      and(
        eq(walletAccounts.kind, "escrow"),
        eq(campaigns.ownerId, ownerId),
      ),
    );

  return Number(row?.balance ?? 0);
}

async function getCampaignEscrowBalance(campaignId: string): Promise<number> {
  const [row] = await db
    .select({
      balance: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)`,
    })
    .from(walletAccounts)
    .leftJoin(ledgerEntries, eq(ledgerEntries.accountId, walletAccounts.id))
    .where(
      and(
        eq(walletAccounts.kind, "escrow"),
        eq(walletAccounts.campaignId, campaignId),
      ),
    );

  return Number(row?.balance ?? 0);
}

async function listCampaignSummaries(
  ownerId: string,
): Promise<BusinessCampaignSummary[]> {
  const ownedCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.ownerId, ownerId))
    .orderBy(desc(campaigns.updatedAt))
    .limit(50);

  if (ownedCampaigns.length === 0) {
    return [];
  }

  const campaignIds = ownedCampaigns.map((campaign) => campaign.id);
  const [campaignClaims, campaignSubmissions] = await Promise.all([
    db
      .select({
        campaignId: claims.campaignId,
        status: claims.status,
      })
      .from(claims)
      .where(inArray(claims.campaignId, campaignIds)),
    db
      .select({
        campaignId: submissions.campaignId,
        status: submissions.status,
      })
      .from(submissions)
      .where(inArray(submissions.campaignId, campaignIds)),
  ]);

  return ownedCampaigns.map((campaign) => {
    const relatedClaims = campaignClaims.filter(
      (claim) => claim.campaignId === campaign.id,
    );
    const relatedSubmissions = campaignSubmissions.filter(
      (submission) => submission.campaignId === campaign.id,
    );

    return {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      status: campaign.status,
      rewardCents: campaign.rewardCents,
      slotCapacity: campaign.slotCapacity,
      deadline: campaign.deadline.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      claimedSlots: relatedClaims.filter(
        (claim) => claim.status === "active" || claim.status === "submitted",
      ).length,
      submissionCount: relatedSubmissions.length,
      pendingReviewCount: relatedSubmissions.filter(
        (submission) => submission.status === "pending",
      ).length,
      approvedCount: relatedSubmissions.filter(
        (submission) => submission.status === "approved",
      ).length,
    };
  });
}

export async function getBusinessDashboard(
  ownerId: string,
): Promise<BusinessDashboardData> {
  const [balanceCents, escrowCents, campaignSummaries, reviewRows] =
    await Promise.all([
      getUserBalance(ownerId),
      getOwnedEscrowBalance(ownerId),
      listCampaignSummaries(ownerId),
      db
        .select({
          id: submissions.id,
          campaignId: campaigns.id,
          campaignTitle: campaigns.title,
          earnerName: users.name,
          version: submissions.version,
          submittedAt: submissions.submittedAt,
        })
        .from(submissions)
        .innerJoin(campaigns, eq(campaigns.id, submissions.campaignId))
        .innerJoin(users, eq(users.id, submissions.earnerId))
        .where(
          and(
            eq(campaigns.ownerId, ownerId),
            eq(submissions.status, "pending"),
          ),
        )
        .orderBy(desc(submissions.submittedAt))
        .limit(8),
    ]);

  return {
    balanceCents,
    escrowCents,
    campaigns: campaignSummaries,
    pendingReviews: reviewRows.map((row) => ({
      ...row,
      submittedAt: row.submittedAt.toISOString(),
    })),
  };
}

export async function getBusinessCampaign(
  campaignId: string,
  ownerId: string,
): Promise<BusinessCampaignDetail | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.ownerId, ownerId)))
    .limit(1);

  if (!campaign) {
    return null;
  }

  const [requirements, claimRows, submissionRows, escrowCents] =
    await Promise.all([
      db
        .select()
        .from(proofRequirements)
        .where(eq(proofRequirements.campaignId, campaign.id))
        .orderBy(proofRequirements.sortOrder),
      db
        .select({ status: claims.status })
        .from(claims)
        .where(eq(claims.campaignId, campaign.id)),
      db
        .select({
          id: submissions.id,
          earnerName: users.name,
          status: submissions.status,
          version: submissions.version,
          submittedAt: submissions.submittedAt,
          reviewedAt: submissions.reviewedAt,
        })
        .from(submissions)
        .innerJoin(users, eq(users.id, submissions.earnerId))
        .where(eq(submissions.campaignId, campaign.id))
        .orderBy(desc(submissions.submittedAt)),
      getCampaignEscrowBalance(campaign.id),
    ]);

  const claimedSlots = claimRows.filter(
    (claim) => claim.status === "active" || claim.status === "submitted",
  ).length;
  const pendingReviewCount = submissionRows.filter(
    (submission) => submission.status === "pending",
  ).length;
  const approvedCount = submissionRows.filter(
    (submission) => submission.status === "approved",
  ).length;

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      status: campaign.status,
      rewardCents: campaign.rewardCents,
      slotCapacity: campaign.slotCapacity,
      deadline: campaign.deadline.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      claimedSlots,
      submissionCount: submissionRows.length,
      pendingReviewCount,
      approvedCount,
      description: campaign.description,
      category: campaign.category,
      instructions: campaign.instructions,
      claimWindowHours: campaign.claimWindowHours,
      publishedAt: campaign.publishedAt?.toISOString() ?? null,
      closedAt: campaign.closedAt?.toISOString() ?? null,
    },
    escrowCents,
    proofRequirements: requirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      helpText: requirement.helpText,
      fieldType: requirement.fieldType,
      required: requirement.required,
    })),
    submissions: submissionRows.map((submission) => ({
      ...submission,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    })),
  };
}

export async function getSubmissionForReview(
  submissionId: string,
  ownerId: string,
): Promise<SubmissionReviewDetail | null> {
  const [submission] = await db
    .select({
      id: submissions.id,
      campaignId: campaigns.id,
      campaignTitle: campaigns.title,
      rewardCents: campaigns.rewardCents,
      earnerName: users.name,
      earnerEmail: users.email,
      status: submissions.status,
      version: submissions.version,
      submittedAt: submissions.submittedAt,
      reviewFeedback: submissions.reviewFeedback,
      rejectionReason: submissions.rejectionReason,
    })
    .from(submissions)
    .innerJoin(campaigns, eq(campaigns.id, submissions.campaignId))
    .innerJoin(users, eq(users.id, submissions.earnerId))
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(campaigns.ownerId, ownerId),
      ),
    )
    .limit(1);

  if (!submission) {
    return null;
  }

  const [answerRows, fileRows] = await Promise.all([
    db
      .select({
        id: submissionAnswers.id,
        label: proofRequirements.label,
        helpText: proofRequirements.helpText,
        fieldType: proofRequirements.fieldType,
        value: submissionAnswers.value,
        sortOrder: proofRequirements.sortOrder,
      })
      .from(submissionAnswers)
      .innerJoin(
        proofRequirements,
        eq(proofRequirements.id, submissionAnswers.proofRequirementId),
      )
      .where(eq(submissionAnswers.submissionId, submission.id))
      .orderBy(proofRequirements.sortOrder),
    db
      .select({
        id: proofFiles.id,
        name: proofFiles.originalName,
        mimeType: proofFiles.mimeType,
        sizeBytes: proofFiles.sizeBytes,
      })
      .from(proofFiles)
      .where(eq(proofFiles.submissionId, submission.id)),
  ]);

  const filesById = new Map(fileRows.map((file) => [file.id, file]));

  return {
    ...submission,
    submittedAt: submission.submittedAt.toISOString(),
    answers: answerRows.map((answer) => ({
      id: answer.id,
      label: answer.label,
      helpText: answer.helpText,
      fieldType: answer.fieldType,
      value: answer.value,
      file:
        typeof answer.value === "string"
          ? (filesById.get(answer.value) ?? null)
          : null,
    })),
  };
}

export async function getBusinessWalletHistory(
  userId: string,
): Promise<{ balanceCents: number; items: WalletHistoryItem[] }> {
  const [account, balanceCents] = await Promise.all([
    db
      .select({ id: walletAccounts.id })
      .from(walletAccounts)
      .where(
        and(
          eq(walletAccounts.kind, "user"),
          eq(walletAccounts.userId, userId),
        ),
      )
      .limit(1),
    getUserBalance(userId),
  ]);

  if (!account[0]) {
    return { balanceCents, items: [] };
  }

  const rows = await db
    .select({
      id: ledgerEntries.id,
      kind: ledgerTransactions.kind,
      amountCents: ledgerEntries.amountCents,
      campaignTitle: campaigns.title,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .innerJoin(
      ledgerTransactions,
      eq(ledgerTransactions.id, ledgerEntries.transactionId),
    )
    .leftJoin(campaigns, eq(campaigns.id, ledgerTransactions.campaignId))
    .where(eq(ledgerEntries.accountId, account[0].id))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(100);

  return {
    balanceCents,
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
