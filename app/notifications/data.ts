import "server-only";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { listNotifications } from "@/lib/services/notifications";

export async function getNotificationFeed(userId: string) {
  const rows = await listNotifications(userId, { limit: 60 });
  const campaignIds = [
    ...new Set(
      rows
        .map((notification) => notification.campaignId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const campaignRows =
    campaignIds.length > 0
      ? await db
          .select({
            id: campaigns.id,
            title: campaigns.title,
            slug: campaigns.slug,
          })
          .from(campaigns)
          .where(inArray(campaigns.id, campaignIds))
      : [];
  const campaignMap = new Map(
    campaignRows.map((campaign) => [campaign.id, campaign]),
  );

  return rows.map((notification) => ({
    ...notification,
    campaign: notification.campaignId
      ? (campaignMap.get(notification.campaignId) ?? null)
      : null,
  }));
}
