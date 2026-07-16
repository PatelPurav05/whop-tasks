import {
  and,
  count,
  desc,
  eq,
  inArray,
  lt,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  claims,
  proofRequirements,
  submissions,
} from "@/db/schema";
import { reconcileExpiredClaims } from "./claims";
import { assertDomain } from "./errors";
import { refundCampaignEscrow, reserveCampaignFunds } from "./ledger";
import { createNotification } from "./notifications";
import {
  createCampaignInputSchema,
  type CreateCampaignInput,
} from "./validation";

export async function createCampaign(
  ownerId: string,
  rawInput: CreateCampaignInput,
): Promise<typeof campaigns.$inferSelect> {
  const input = createCampaignInputSchema.parse(rawInput);
  assertDomain(
    input.deadline > new Date(),
    "VALIDATION",
    "Campaign deadline must be in the future",
  );

  return await db.transaction(async (tx) => {
    const [campaign] = await tx
      .insert(campaigns)
      .values({
        ownerId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        category: input.category,
        instructions: input.instructions,
        rewardCents: input.rewardCents,
        slotCapacity: input.slotCapacity,
        claimWindowHours: input.claimWindowHours,
        deadline: input.deadline,
      })
      .returning();

    assertDomain(campaign, "NOT_FOUND", "Campaign was not created");

    await tx.insert(proofRequirements).values(
      input.proofRequirements.map((requirement, sortOrder) => ({
        campaignId: campaign.id,
        key: requirement.key,
        label: requirement.label,
        helpText: requirement.helpText,
        fieldType: requirement.fieldType,
        required: requirement.required,
        sortOrder,
        config: requirement.config,
      })),
    );

    return campaign;
  });
}

export async function publishCampaign(
  campaignId: string,
  ownerId: string,
): Promise<typeof campaigns.$inferSelect> {
  return await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .for("update")
      .limit(1);

    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");
    assertDomain(
      campaign.ownerId === ownerId,
      "FORBIDDEN",
      "Only the campaign owner can publish",
    );
    assertDomain(
      campaign.status === "draft",
      "INVALID_STATE",
      "Only a draft campaign can be published",
    );
    assertDomain(
      campaign.deadline > new Date(),
      "EXPIRED",
      "Choose a future deadline before publishing",
    );

    const [requirementCount] = await tx
      .select({ value: count() })
      .from(proofRequirements)
      .where(eq(proofRequirements.campaignId, campaign.id));

    assertDomain(
      Number(requirementCount?.value ?? 0) > 0,
      "VALIDATION",
      "Add at least one proof requirement before publishing",
    );

    const escrowCents = campaign.rewardCents * campaign.slotCapacity;
    assertDomain(
      Number.isSafeInteger(escrowCents),
      "VALIDATION",
      "Campaign budget is too large",
    );

    await reserveCampaignFunds(tx, {
      ownerId,
      campaignId: campaign.id,
      amountCents: escrowCents,
    });

    const now = new Date();
    const [published] = await tx
      .update(campaigns)
      .set({
        status: "active",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(campaigns.id, campaign.id))
      .returning();

    assertDomain(published, "NOT_FOUND", "Campaign was not published");
    return published;
  });
}

export async function archiveCampaign(
  campaignId: string,
  ownerId: string,
): Promise<typeof campaigns.$inferSelect> {
  return await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .for("update")
      .limit(1);

    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");
    assertDomain(
      campaign.ownerId === ownerId,
      "FORBIDDEN",
      "Only the campaign owner can archive",
    );
    assertDomain(
      campaign.status === "draft" || campaign.status === "active",
      "INVALID_STATE",
      "This campaign is already closed",
    );

    const now = new Date();
    if (campaign.status === "active") {
      await reconcileExpiredClaims(tx, campaign.id, now);

      const [openReviews] = await tx
        .select({ value: count() })
        .from(submissions)
        .where(
          and(
            eq(submissions.campaignId, campaign.id),
            inArray(submissions.status, ["pending", "changes_requested"]),
          ),
        );

      assertDomain(
        Number(openReviews?.value ?? 0) === 0,
        "INVALID_STATE",
        "Resolve open submissions before archiving this campaign",
      );

      await tx
        .update(claims)
        .set({ status: "cancelled", updatedAt: now })
        .where(
          and(
            eq(claims.campaignId, campaign.id),
            eq(claims.status, "active"),
          ),
        );

      const refundId = await refundCampaignEscrow(tx, {
        campaignId: campaign.id,
        ownerId,
      });

      if (refundId) {
        await createNotification(tx, {
          recipientId: ownerId,
          type: "campaign_refunded",
          campaignId: campaign.id,
          payload: { ledgerTransactionId: refundId },
        });
      }
    }

    const [archived] = await tx
      .update(campaigns)
      .set({
        status: "archived",
        closedAt: now,
        updatedAt: now,
      })
      .where(eq(campaigns.id, campaign.id))
      .returning();

    assertDomain(archived, "NOT_FOUND", "Campaign was not archived");
    return archived;
  });
}

export async function listActiveCampaigns(options: {
  category?: string;
  before?: Date;
  limit?: number;
}): Promise<
  Array<typeof campaigns.$inferSelect & { claimedSlots: number }>
> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 50);

  return await db.transaction(async (tx) => {
    const conditions = [eq(campaigns.status, "active")];
    if (options.category) {
      conditions.push(eq(campaigns.category, options.category));
    }
    if (options.before) {
      conditions.push(lt(campaigns.publishedAt, options.before));
    }

    const rows = await tx
      .select()
      .from(campaigns)
      .where(and(...conditions))
      .orderBy(desc(campaigns.publishedAt), desc(campaigns.id))
      .limit(limit);

    const now = new Date();
    const results: Array<
      typeof campaigns.$inferSelect & { claimedSlots: number }
    > = [];

    for (const campaign of rows) {
      await reconcileExpiredClaims(tx, campaign.id, now);
      const [capacity] = await tx
        .select({
          value: sql<number>`count(*)`,
        })
        .from(claims)
        .where(
          and(
            eq(claims.campaignId, campaign.id),
            inArray(claims.status, ["active", "submitted"]),
          ),
        );

      results.push({
        ...campaign,
        claimedSlots: Number(capacity?.value ?? 0),
      });
    }

    return results;
  });
}
