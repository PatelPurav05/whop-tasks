import { and, desc, eq, lt } from "drizzle-orm";
import { db, type DatabaseTransaction } from "@/db";
import {
  notificationTypeEnum,
  notifications,
  type JsonValue,
} from "@/db/schema";
import { assertDomain } from "./errors";

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export async function createNotification(
  tx: DatabaseTransaction,
  input: {
    recipientId: string;
    type: NotificationType;
    campaignId?: string;
    submissionId?: string;
    payload?: Record<string, JsonValue>;
  },
): Promise<string> {
  const [notification] = await tx
    .insert(notifications)
    .values(input)
    .returning({ id: notifications.id });

  assertDomain(notification, "NOT_FOUND", "Notification was not created");
  return notification.id;
}

export async function listNotifications(
  recipientId: string,
  options: { limit?: number; before?: Date } = {},
): Promise<(typeof notifications.$inferSelect)[]> {
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const conditions = [eq(notifications.recipientId, recipientId)];

  if (options.before) {
    conditions.push(lt(notifications.createdAt, options.before));
  }

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(
  recipientId: string,
  notificationId: string,
): Promise<void> {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientId, recipientId),
      ),
    )
    .returning({ id: notifications.id });

  assertDomain(updated, "NOT_FOUND", "Notification was not found");
}
