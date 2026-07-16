import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  claims,
  proofRequirements,
  submissions,
  users,
} from "@/db/schema";
import { listActiveCampaigns } from "@/lib/services/campaigns";
import { reconcileExpiredClaims } from "@/lib/services/claims";

export type MarketplaceTask = Awaited<
  ReturnType<typeof getMarketplaceTasks>
>[number];

export async function getMarketplaceTasks(options: {
  category?: string;
  query?: string;
  availableOnly?: boolean;
  minimumRewardCents?: number;
}) {
  const campaignRows = await listActiveCampaigns({
    category: options.category,
    limit: 50,
  });
  const ownerIds = [...new Set(campaignRows.map((campaign) => campaign.ownerId))];
  const ownerRows =
    ownerIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            handle: users.handle,
            image: users.image,
          })
          .from(users)
          .where(inArray(users.id, ownerIds))
      : [];
  const ownerMap = new Map(ownerRows.map((owner) => [owner.id, owner]));
  const normalizedQuery = options.query?.trim().toLocaleLowerCase();

  return campaignRows
    .filter((campaign) => {
      if (
        options.availableOnly &&
        campaign.claimedSlots >= campaign.slotCapacity
      ) {
        return false;
      }
      if (
        options.minimumRewardCents &&
        campaign.rewardCents < options.minimumRewardCents
      ) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return `${campaign.title} ${campaign.description} ${campaign.category}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    })
    .map((campaign) => ({
      ...campaign,
      owner: ownerMap.get(campaign.ownerId) ?? {
        id: campaign.ownerId,
        name: "Whop business",
        handle: null,
        image: null,
      },
    }));
}

export async function getTaskDetail(slug: string, currentUserId?: string) {
  return await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.slug, slug))
      .limit(1);

    if (!campaign) {
      return null;
    }

    if (campaign.status === "active") {
      await reconcileExpiredClaims(tx, campaign.id, new Date());
    }

    const [[owner], requirements, [capacity], currentClaim] = await Promise.all([
      tx
        .select({
          id: users.id,
          name: users.name,
          handle: users.handle,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, campaign.ownerId))
        .limit(1),
      tx
        .select()
        .from(proofRequirements)
        .where(eq(proofRequirements.campaignId, campaign.id))
        .orderBy(proofRequirements.sortOrder),
      tx
        .select({ value: count() })
        .from(claims)
        .where(
          and(
            eq(claims.campaignId, campaign.id),
            inArray(claims.status, ["active", "submitted"]),
          ),
        ),
      currentUserId
        ? tx
            .select()
            .from(claims)
            .where(
              and(
                eq(claims.campaignId, campaign.id),
                eq(claims.earnerId, currentUserId),
              ),
            )
            .orderBy(desc(claims.claimedAt))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ]);

    const submission = currentClaim
      ? (
          await tx
            .select()
            .from(submissions)
            .where(eq(submissions.claimId, currentClaim.id))
            .limit(1)
        )[0] ?? null
      : null;

    return {
      campaign,
      owner: owner ?? {
        id: campaign.ownerId,
        name: "Whop business",
        handle: null,
        image: null,
      },
      requirements,
      claimedSlots: Number(capacity?.value ?? 0),
      currentClaim,
      submission,
    };
  });
}
