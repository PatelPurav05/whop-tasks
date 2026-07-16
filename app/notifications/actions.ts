"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUserId } from "@/lib/permissions";
import { markNotificationRead } from "@/lib/services/notifications";

export type NotificationActionState = {
  error: string | null;
  read: boolean;
};

export async function markNotificationReadAction(
  _previousState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const notificationId = z.string().uuid().safeParse(formData.get("id"));
  if (!notificationId.success) {
    return { error: "This notification is invalid.", read: false };
  }

  try {
    const userId = await requireCurrentUserId();
    await markNotificationRead(userId, notificationId.data);
  } catch {
    return {
      error: "We could not update this notification. Try again.",
      read: false,
    };
  }

  revalidatePath("/notifications");
  return { error: null, read: true };
}
