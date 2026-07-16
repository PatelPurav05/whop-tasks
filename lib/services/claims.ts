import { and, count, eq, inArray, lte } from "drizzle-orm";
import { db, type DatabaseTransaction } from "@/db";
import { campaigns, claims } from "@/db/schema";
import { assertDomain } from "./errors";
import { createNotification } from "./notifications";

export async function reconcileExpiredClaims(
  tx: DatabaseTransaction,
  campaignId: string,
  now: Date,
): Promise<number> {
  const expired = await tx
    .update(claims)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(claims.campaignId, campaignId),
        eq(claims.status, "active"),
        lte(claims.expiresAt, now),
      ),
    )
    .returning({
      id: claims.id,
      earnerId: claims.earnerId,
    });

  for (const claim of expired) {
    await createNotification(tx, {
      recipientId: claim.earnerId,
      type: "claim_expired",
      campaignId,
      payload: { claimId: claim.id },
    });
  }

  return expired.length;
}

export async function claimCampaign(
  campaignId: string,
  earnerId: string,
): Promise<typeof claims.$inferSelect> {
  return await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .for("update")
      .limit(1);

    assertDomain(campaign, "NOT_FOUND", "Campaign was not found");
    assertDomain(
      campaign.ownerId !== earnerId,
      "FORBIDDEN",
      "You cannot claim your own campaign",
    );
    assertDomain(
      campaign.status === "active",
      "INVALID_STATE",
      "This campaign is not accepting claims",
    );

    const now = new Date();
    assertDomain(
      campaign.deadline > now,
      "EXPIRED",
      "This campaign deadline has passed",
    );

    await reconcileExpiredClaims(tx, campaign.id, now);

    const [duplicate] = await tx
      .select({ id: claims.id })
      .from(claims)
      .where(
        and(
          eq(claims.campaignId, campaign.id),
          eq(claims.earnerId, earnerId),
          inArray(claims.status, ["active", "submitted"]),
        ),
      )
      .limit(1);

    assertDomain(
      !duplicate,
      "CONFLICT",
      "You already have an open claim for this campaign",
    );

    const [capacity] = await tx
      .select({ used: count() })
      .from(claims)
      .where(
        and(
          eq(claims.campaignId, campaign.id),
          inArray(claims.status, ["active", "submitted"]),
        ),
      );

    assertDomain(
      Number(capacity?.used ?? 0) < campaign.slotCapacity,
      "CONFLICT",
      "All task slots have been claimed",
    );

    const claimExpiry = new Date(
      now.getTime() + campaign.claimWindowHours * 60 * 60 * 1000,
    );
    const expiresAt =
      claimExpiry < campaign.deadline ? claimExpiry : campaign.deadline;

    const [claim] = await tx
      .insert(claims)
      .values({
        campaignId: campaign.id,
        earnerId,
        expiresAt,
      })
      .returning();

    assertDomain(claim, "NOT_FOUND", "Claim was not created");

    await createNotification(tx, {
      recipientId: campaign.ownerId,
      type: "claim_created",
      campaignId: campaign.id,
      payload: {
        claimId: claim.id,
        earnerId,
      },
    });

    return claim;
  });
}
