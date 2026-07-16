"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import type {
  ActionResult,
  CampaignDraftInput,
} from "@/components/business/types";
import { formatMoney } from "@/components/business/format";
import { requireCurrentUserId } from "@/lib/permissions";
import {
  archiveCampaign,
  createCampaign,
  publishCampaign,
} from "@/lib/services/campaigns";
import { DomainError } from "@/lib/services/errors";
import { getUserBalance } from "@/lib/services/ledger";
import { reviewSubmission } from "@/lib/services/submissions";

const campaignIdSchema = z.string().uuid();
const creationIntentSchema = z.enum(["draft", "publish"]);

function createCampaignSlug(title: string): string {
  const base =
    title
      .toLocaleLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "task";

  return `${base}-${randomUUID().slice(0, 7)}`;
}

export type ReviewActionInput =
  | {
      submissionId: string;
      expectedVersion: number;
      decision: "approve";
    }
  | {
      submissionId: string;
      expectedVersion: number;
      decision: "request_changes";
      feedback: string;
    }
  | {
      submissionId: string;
      expectedVersion: number;
      decision: "reject";
      reason: string;
    };

function errorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the highlighted information";
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "We could not create a unique task link. Try saving again";
  }
  if (error instanceof Error && error.name === "AuthenticationError") {
    return error.message;
  }
  return "Something went wrong. Refresh and try again";
}

function refreshBusinessRoutes(campaignId?: string, submissionId?: string): void {
  revalidatePath("/business");
  revalidatePath("/business/wallet");
  if (campaignId) {
    revalidatePath(`/business/campaigns/${campaignId}`);
  }
  if (submissionId) {
    revalidatePath(`/business/submissions/${submissionId}`);
  }
}

export async function createCampaignAction(
  rawInput: CampaignDraftInput,
  rawIntent: "draft" | "publish",
): Promise<ActionResult> {
  try {
    const ownerId = await requireCurrentUserId();
    const intent = creationIntentSchema.parse(rawIntent);
    const campaign = await createCampaign(ownerId, {
      ...rawInput,
      slug: createCampaignSlug(rawInput.title),
      deadline: new Date(rawInput.deadline),
    });

    if (intent === "publish") {
      try {
        await publishCampaign(campaign.id, ownerId);
      } catch (error) {
        refreshBusinessRoutes(campaign.id);
        return {
          ok: false,
          message: `${errorMessage(error)}. Your campaign is saved as a draft`,
          redirectTo: `/business/campaigns/${campaign.id}`,
        };
      }
    }

    refreshBusinessRoutes(campaign.id);
    return {
      ok: true,
      message:
        intent === "publish"
          ? `${formatMoney(campaign.rewardCents * campaign.slotCapacity)} moved into escrow. Your campaign is live`
          : "Draft saved. No funds were reserved",
      redirectTo: `/business/campaigns/${campaign.id}`,
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function publishCampaignAction(
  rawCampaignId: string,
): Promise<ActionResult> {
  try {
    const campaignId = campaignIdSchema.parse(rawCampaignId);
    const ownerId = await requireCurrentUserId();
    const campaign = await publishCampaign(campaignId, ownerId);
    refreshBusinessRoutes(campaign.id);

    return {
      ok: true,
      message: `${formatMoney(campaign.rewardCents * campaign.slotCapacity)} moved into escrow. Your campaign is live`,
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function archiveCampaignAction(
  rawCampaignId: string,
): Promise<ActionResult> {
  try {
    const campaignId = campaignIdSchema.parse(rawCampaignId);
    const ownerId = await requireCurrentUserId();
    const balanceBefore = await getUserBalance(ownerId);
    const campaign = await archiveCampaign(campaignId, ownerId);
    const balanceAfter = await getUserBalance(ownerId);
    const refundedCents = Math.max(balanceAfter - balanceBefore, 0);
    refreshBusinessRoutes(campaign.id);

    return {
      ok: true,
      message:
        refundedCents > 0
          ? `${formatMoney(refundedCents)} in unused escrow was refunded to your wallet`
          : "Campaign archived. There was no unused escrow to refund",
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function reviewSubmissionAction(
  input: ReviewActionInput,
): Promise<ActionResult> {
  try {
    const reviewerId = await requireCurrentUserId();
    const submission = await reviewSubmission(reviewerId, input);
    refreshBusinessRoutes(submission.campaignId, submission.id);

    if (input.decision === "approve") {
      return {
        ok: true,
        message: "Submission approved. The reward was paid from escrow",
      };
    }
    if (input.decision === "request_changes") {
      return {
        ok: true,
        message: "Changes requested. The earner can revise and resubmit",
      };
    }
    return {
      ok: true,
      message: "Submission rejected. The reserved slot is available again",
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
