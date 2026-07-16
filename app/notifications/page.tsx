import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationItem } from "@/components/shared/notification-item";
import { ProductShell } from "@/components/shared/product-shell";
import { getCurrentSession } from "@/lib/permissions";
import { getNotificationFeed } from "./data";

export const metadata: Metadata = {
  title: "Notifications",
};

const notificationDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function NotificationsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/notifications");
  }

  const notifications = await getNotificationFeed(session.user.id);
  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  return (
    <ProductShell active="notifications">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Activity
            </p>
            <h1 className="mt-2 text-[32px] leading-[35px] font-medium">
              Notifications
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                : "You are caught up"}
            </p>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                type={notification.type}
                campaignTitle={notification.campaign?.title ?? null}
                campaignSlug={notification.campaign?.slug ?? null}
                createdLabel={notificationDateFormatter.format(
                  notification.createdAt,
                )}
                isRead={notification.readAt !== null}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <h2 className="text-[20px] leading-[23px] font-medium">
              Updates will land here
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Claim activity, review feedback, approvals, and expiry notices
              will appear in one place.
            </p>
          </div>
        )}
      </div>
    </ProductShell>
  );
}
