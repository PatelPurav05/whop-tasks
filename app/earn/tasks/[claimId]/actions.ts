"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getClaimProofContext } from "@/app/earn/data";
import { requireCurrentUserId } from "@/lib/permissions";
import { DomainError } from "@/lib/services/errors";
import { createPrivateFile } from "@/lib/services/files";
import {
  resubmitProof,
  submitProof,
} from "@/lib/services/submissions";
import type { SubmissionAnswerInput } from "@/lib/services/validation";

export type ProofActionState = {
  error: string | null;
};

const claimIdSchema = z.string().uuid();

function getTextValue(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : null;
}

export async function submitProofAction(
  _previousState: ProofActionState,
  formData: FormData,
): Promise<ProofActionState> {
  const parsedClaimId = claimIdSchema.safeParse(formData.get("claimId"));
  if (!parsedClaimId.success) {
    return { error: "This claim is invalid. Return to My tasks and try again." };
  }

  const claimId = parsedClaimId.data;

  try {
    const userId = await requireCurrentUserId();
    const context = await getClaimProofContext(claimId, userId);
    if (!context) {
      return { error: "This claim was not found." };
    }

    const existingAnswerMap = new Map(
      context.answers.map((answer) => [
        answer.proofRequirementId,
        answer.value,
      ]),
    );
    const answers: SubmissionAnswerInput[] = [];

    for (const requirement of context.requirements) {
      const fieldName = `proof_${requirement.id}`;

      if (
        requirement.fieldType === "short_text" ||
        requirement.fieldType === "long_text" ||
        requirement.fieldType === "url"
      ) {
        answers.push({
          requirementId: requirement.id,
          value: getTextValue(formData, fieldName),
        });
        continue;
      }

      if (requirement.fieldType === "confirmation") {
        answers.push({
          requirementId: requirement.id,
          value: formData.get(fieldName) === "on",
        });
        continue;
      }

      const fileValue = formData.get(fieldName);
      if (fileValue instanceof File && fileValue.size > 0) {
        const uploaded = await createPrivateFile({
          ownerId: userId,
          originalName: fileValue.name,
          mimeType: fileValue.type,
          data: new Uint8Array(await fileValue.arrayBuffer()),
        });
        answers.push({
          requirementId: requirement.id,
          value: uploaded.id,
        });
        continue;
      }

      answers.push({
        requirementId: requirement.id,
        value: existingAnswerMap.get(requirement.id) ?? null,
      });
    }

    if (context.submission) {
      if (context.submission.status !== "changes_requested") {
        return { error: "This submission is no longer accepting changes." };
      }
      await resubmitProof(userId, {
        submissionId: context.submission.id,
        expectedVersion: context.submission.version,
        answers,
      });
    } else {
      await submitProof(userId, { claimId, answers });
    }
  } catch (error) {
    if (error instanceof DomainError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Review your proof fields." };
    }
    return {
      error: "Your proof was not submitted. Review the fields and try again.",
    };
  }

  revalidatePath(`/earn/tasks/${claimId}`);
  revalidatePath("/earn");
  revalidatePath("/notifications");
  redirect(`/earn/tasks/${claimId}?submitted=1`);
}
