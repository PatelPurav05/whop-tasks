"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUserId } from "@/lib/permissions";
import { claimCampaign } from "@/lib/services/claims";
import { DomainError } from "@/lib/services/errors";

export type ClaimTaskState = {
  error: string | null;
};

const claimInputSchema = z.object({
  campaignId: z.string().uuid(),
  slug: z.string().min(3).max(80),
});

export async function claimTaskAction(
  _previousState: ClaimTaskState,
  formData: FormData,
): Promise<ClaimTaskState> {
  const parsed = claimInputSchema.safeParse({
    campaignId: formData.get("campaignId"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { error: "This task link is invalid. Refresh and try again." };
  }

  let claimId: string;
  try {
    const userId = await requireCurrentUserId();
    const claim = await claimCampaign(parsed.data.campaignId, userId);
    claimId = claim.id;
  } catch (error) {
    if (error instanceof DomainError) {
      return { error: error.message };
    }
    return { error: "We could not claim this task. Refresh and try again." };
  }

  revalidatePath(`/tasks/${parsed.data.slug}`);
  revalidatePath("/earn");
  redirect(`/earn/tasks/${claimId}`);
}
