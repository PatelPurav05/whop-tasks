import { and, count, eq, inArray } from "drizzle-orm";
import { db, type DatabaseTransaction } from "@/db";
import {
  campaigns,
  claims,
  files,
  proofRequirements,
  submissionAnswers,
  submissions,
  type JsonValue,
  type ProofRequirement,
} from "@/db/schema";
import { reconcileExpiredClaims } from "./claims";
import { assertDomain } from "./errors";
import { paySubmissionFromEscrow } from "./ledger";
import { createNotification } from "./notifications";
import {
  resubmitProofInputSchema,
  reviewSubmissionInputSchema,
  submitProofInputSchema,
  type ResubmitProofInput,
  type ReviewSubmissionInput,
  type SubmissionAnswerInput,
  type SubmitProofInput,
} from "./validation";

type ValidatedAnswer = {
  requirementId: string;
  value: JsonValue;
  fileId?: string;
};

function validateText(
  value: unknown,
  requirement: ProofRequirement,
): string | null {
  if (value === null || value === undefined || value === "") {
    assertDomain(
      !requirement.required,
      "VALIDATION",
      `${requirement.label} is required`,
      { requirementId: requirement.id },
    );
    return null;
  }

  assertDomain(
    typeof value === "string",
    "VALIDATION",
    `${requirement.label} must be text`,
  );

  const normalized = value.trim();
  assertDomain(
    !requirement.required || normalized.length > 0,
    "VALIDATION",
    `${requirement.label} is required`,
  );
  assertDomain(
    !requirement.config.maxLength ||
      normalized.length <= requirement.config.maxLength,
    "VALIDATION",
    `${requirement.label} is too long`,
  );
  return normalized;
}

async function validateAnswers(
  tx: DatabaseTransaction,
  requirements: ProofRequirement[],
  rawAnswers: SubmissionAnswerInput[],
  earnerId: string,
  existingSubmissionId?: string,
): Promise<ValidatedAnswer[]> {
  const requirementMap = new Map(
    requirements.map((requirement) => [requirement.id, requirement]),
  );
  const seen = new Set<string>();
  const validated: ValidatedAnswer[] = [];

  for (const rawAnswer of rawAnswers) {
    assertDomain(
      !seen.has(rawAnswer.requirementId),
      "VALIDATION",
      "Each proof requirement can be answered once",
    );
    seen.add(rawAnswer.requirementId);

    const requirement = requirementMap.get(rawAnswer.requirementId);
    assertDomain(
      requirement,
      "VALIDATION",
      "A proof answer does not belong to this campaign",
    );

    if (
      requirement.fieldType === "short_text" ||
      requirement.fieldType === "long_text"
    ) {
      const text = validateText(rawAnswer.value, requirement);
      validated.push({ requirementId: requirement.id, value: text });
      continue;
    }

    if (requirement.fieldType === "url") {
      const text = validateText(rawAnswer.value, requirement);
      if (text !== null) {
        let parsedUrl: URL | null = null;
        try {
          parsedUrl = new URL(text);
        } catch {
          parsedUrl = null;
        }
        assertDomain(
          parsedUrl &&
            (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:"),
          "VALIDATION",
          `${requirement.label} must be a valid web URL`,
        );
      }
      validated.push({ requirementId: requirement.id, value: text });
      continue;
    }

    if (requirement.fieldType === "confirmation") {
      assertDomain(
        typeof rawAnswer.value === "boolean",
        "VALIDATION",
        `${requirement.label} must be confirmed`,
      );
      assertDomain(
        !requirement.required || rawAnswer.value,
        "VALIDATION",
        `${requirement.label} must be confirmed`,
      );
      validated.push({
        requirementId: requirement.id,
        value: rawAnswer.value,
      });
      continue;
    }

    if (rawAnswer.value === null || rawAnswer.value === undefined) {
      assertDomain(
        !requirement.required,
        "VALIDATION",
        `${requirement.label} is required`,
      );
      validated.push({ requirementId: requirement.id, value: null });
      continue;
    }

    assertDomain(
      typeof rawAnswer.value === "string",
      "VALIDATION",
      `${requirement.label} must reference an uploaded file`,
    );

    const [file] = await tx
      .select()
      .from(files)
      .where(eq(files.id, rawAnswer.value))
      .for("update")
      .limit(1);

    assertDomain(file, "VALIDATION", "The uploaded proof file was not found");
    assertDomain(
      file.ownerId === earnerId,
      "FORBIDDEN",
      "You can only submit files you uploaded",
    );
    assertDomain(
      !file.submissionId || file.submissionId === existingSubmissionId,
      "CONFLICT",
      "This proof file is already attached to a submission",
    );
    assertDomain(
      requirement.fieldType !== "image" || file.mimeType.startsWith("image/"),
      "VALIDATION",
      `${requirement.label} requires an image`,
    );
    assertDomain(
      !requirement.config.acceptedMimeTypes ||
        requirement.config.acceptedMimeTypes.includes(file.mimeType),
      "VALIDATION",
      `${file.originalName} is not an accepted file type`,
    );

    validated.push({
      requirementId: requirement.id,
      value: file.id,
      fileId: file.id,
    });
  }

  for (const requirement of requirements) {
    assertDomain(
      !requirement.required || seen.has(requirement.id),
      "VALIDATION",
      `${requirement.label} is required`,
      { requirementId: requirement.id },
    );
  }

  return validated;
}

async function attachFiles(
  tx: DatabaseTransaction,
  submissionId: string,
  answers: ValidatedAnswer[],
): Promise<void> {
  for (const answer of answers) {
    if (answer.fileId) {
      await tx
        .update(files)
        .set({
          submissionId,
          updatedAt: new Date(),
        })
        .where(eq(files.id, answer.fileId));
    }
  }
}

export async function submitProof(
  earnerId: string,
  rawInput: SubmitProofInput,
): Promise<typeof submissions.$inferSelect> {
  const input = submitProofInputSchema.parse(rawInput);

  return await db.transaction(async (tx) => {
    const [claim] = await tx
      .select()
      .from(claims)
      .where(eq(claims.id, input.claimId))
      .for("update")
      .limit(1);

    assertDomain(claim, "NOT_FOUND", "Claim was not found");
    assertDomain(
      claim.earnerId === earnerId,
      "FORBIDDEN",
      "You can only submit proof for your own claim",
    );

    const now = new Date();
    await reconcileExpiredClaims(tx, claim.campaignId, now);

    assertDomain(
      claim.status === "active" && claim.expiresAt > now,
      "EXPIRED",
      "This claim has expired",
    );

    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, claim.campaignId))
      .limit(1);
    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");

    const requirements = await tx
      .select()
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, campaign.id))
      .orderBy(proofRequirements.sortOrder);

    const answers = await validateAnswers(
      tx,
      requirements,
      input.answers,
      earnerId,
    );

    const [submission] = await tx
      .insert(submissions)
      .values({
        campaignId: campaign.id,
        claimId: claim.id,
        earnerId,
      })
      .returning();
    assertDomain(submission, "NOT_FOUND", "Submission was not created");

    if (answers.length > 0) {
      await tx.insert(submissionAnswers).values(
        answers.map((answer) => ({
          submissionId: submission.id,
          proofRequirementId: answer.requirementId,
          value: answer.value,
        })),
      );
    }
    await attachFiles(tx, submission.id, answers);

    await tx
      .update(claims)
      .set({
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(claims.id, claim.id));

    await createNotification(tx, {
      recipientId: campaign.ownerId,
      type: "submission_received",
      campaignId: campaign.id,
      submissionId: submission.id,
      payload: { claimId: claim.id, earnerId },
    });

    return submission;
  });
}

export async function resubmitProof(
  earnerId: string,
  rawInput: ResubmitProofInput,
): Promise<typeof submissions.$inferSelect> {
  const input = resubmitProofInputSchema.parse(rawInput);

  return await db.transaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.id, input.submissionId))
      .for("update")
      .limit(1);

    assertDomain(submission, "NOT_FOUND", "Submission was not found");
    assertDomain(
      submission.earnerId === earnerId,
      "FORBIDDEN",
      "You can only revise your own submission",
    );
    assertDomain(
      submission.status === "changes_requested",
      "INVALID_STATE",
      "This submission is not awaiting changes",
    );
    assertDomain(
      submission.version === input.expectedVersion,
      "CONFLICT",
      "This submission changed. Refresh before resubmitting",
    );

    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, submission.campaignId))
      .limit(1);
    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");

    const requirements = await tx
      .select()
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, submission.campaignId))
      .orderBy(proofRequirements.sortOrder);
    const answers = await validateAnswers(
      tx,
      requirements,
      input.answers,
      earnerId,
      submission.id,
    );

    await tx
      .delete(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, submission.id));

    if (answers.length > 0) {
      await tx.insert(submissionAnswers).values(
        answers.map((answer) => ({
          submissionId: submission.id,
          proofRequirementId: answer.requirementId,
          value: answer.value,
        })),
      );
    }
    await attachFiles(tx, submission.id, answers);

    const now = new Date();
    const [updated] = await tx
      .update(submissions)
      .set({
        status: "pending",
        version: submission.version + 1,
        reviewFeedback: null,
        rejectionReason: null,
        reviewerId: null,
        reviewedAt: null,
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(submissions.id, submission.id))
      .returning();
    assertDomain(updated, "NOT_FOUND", "Submission was not updated");

    await createNotification(tx, {
      recipientId: campaign.ownerId,
      type: "submission_received",
      campaignId: campaign.id,
      submissionId: updated.id,
      payload: { version: updated.version, resubmitted: true },
    });

    return updated;
  });
}

export async function reviewSubmission(
  reviewerId: string,
  rawInput: ReviewSubmissionInput,
): Promise<typeof submissions.$inferSelect> {
  const input = reviewSubmissionInputSchema.parse(rawInput);

  return await db.transaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.id, input.submissionId))
      .for("update")
      .limit(1);
    assertDomain(submission, "NOT_FOUND", "Submission was not found");

    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, submission.campaignId))
      .for("update")
      .limit(1);
    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");
    assertDomain(
      campaign.ownerId === reviewerId,
      "FORBIDDEN",
      "Only the campaign owner can review submissions",
    );
    assertDomain(
      submission.earnerId !== reviewerId,
      "FORBIDDEN",
      "You cannot review your own submission",
    );
    if (
      input.decision === "approve" &&
      submission.status === "approved" &&
      submission.version === input.expectedVersion
    ) {
      return submission;
    }
    assertDomain(
      submission.status === "pending",
      "INVALID_STATE",
      "This submission is no longer pending review",
    );
    assertDomain(
      submission.version === input.expectedVersion,
      "CONFLICT",
      "This submission changed. Refresh before reviewing",
    );

    const now = new Date();
    let update: Partial<typeof submissions.$inferInsert>;

    if (input.decision === "request_changes") {
      update = {
        status: "changes_requested",
        reviewFeedback: input.feedback,
        reviewerId,
        reviewedAt: now,
        updatedAt: now,
      };
    } else if (input.decision === "reject") {
      update = {
        status: "rejected",
        rejectionReason: input.reason,
        reviewerId,
        reviewedAt: now,
        updatedAt: now,
      };

      await tx
        .update(claims)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(claims.id, submission.claimId));
    } else {
      await paySubmissionFromEscrow(tx, {
        campaignId: campaign.id,
        submissionId: submission.id,
        earnerId: submission.earnerId,
        reviewerId,
        amountCents: campaign.rewardCents,
      });
      update = {
        status: "approved",
        reviewerId,
        reviewedAt: now,
        updatedAt: now,
      };
    }

    const [updated] = await tx
      .update(submissions)
      .set(update)
      .where(eq(submissions.id, submission.id))
      .returning();
    assertDomain(updated, "NOT_FOUND", "Submission review was not saved");

    const notificationType =
      input.decision === "approve"
        ? "submission_approved"
        : input.decision === "reject"
          ? "submission_rejected"
          : "changes_requested";
    await createNotification(tx, {
      recipientId: submission.earnerId,
      type: notificationType,
      campaignId: campaign.id,
      submissionId: submission.id,
      payload:
        input.decision === "request_changes"
          ? { feedback: input.feedback }
          : input.decision === "reject"
            ? { reason: input.reason }
            : { rewardCents: campaign.rewardCents },
    });

    if (input.decision === "approve") {
      const [approvedCount] = await tx
        .select({ value: count() })
        .from(submissions)
        .where(
          and(
            eq(submissions.campaignId, campaign.id),
            eq(submissions.status, "approved"),
          ),
        );

      if (Number(approvedCount?.value ?? 0) >= campaign.slotCapacity) {
        await tx
          .update(campaigns)
          .set({
            status: "completed",
            closedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(campaigns.id, campaign.id),
              inArray(campaigns.status, ["active"]),
            ),
          );
      }
    }

    return updated;
  });
}
