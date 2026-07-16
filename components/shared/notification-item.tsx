"use client";

import { ArrowRight20, Bell20, CheckmarkCircle20 } from "@frosted-ui/icons";
import { Button } from "@whop/react/components";
import Link from "next/link";
import { useActionState } from "react";
import {
  markNotificationReadAction,
  type NotificationActionState,
} from "@/app/notifications/actions";

const initialState: NotificationActionState = { error: null, read: false };

type NotificationType =
  | "claim_created"
  | "submission_received"
  | "changes_requested"
  | "submission_approved"
  | "submission_rejected"
  | "claim_expired"
  | "campaign_refunded";

const notificationCopy: Record<
  NotificationType,
  { title: string; detail: string }
> = {
  claim_created: {
    title: "A task slot was claimed",
    detail: "An earner started work on your campaign.",
  },
  submission_received: {
    title: "Proof is ready to review",
    detail: "A new or revised submission is waiting.",
  },
  changes_requested: {
    title: "Changes requested",
    detail: "Review the feedback and resubmit your proof.",
  },
  submission_approved: {
    title: "Submission approved",
    detail: "The reward was added to your demo wallet.",
  },
  submission_rejected: {
    title: "Submission rejected",
    detail: "Open the task to review the business decision.",
  },
  claim_expired: {
    title: "Claim expired",
    detail: "The reserved slot returned to the marketplace.",
  },
  campaign_refunded: {
    title: "Campaign funds returned",
    detail: "Unused demo escrow moved back to your wallet.",
  },
};

export function NotificationItem({
  id,
  type,
  campaignTitle,
  campaignSlug,
  createdLabel,
  isRead,
}: {
  id: string;
  type: NotificationType;
  campaignTitle: string | null;
  campaignSlug: string | null;
  createdLabel: string;
  isRead: boolean;
}) {
  const [state, action, pending] = useActionState(
    markNotificationReadAction,
    initialState,
  );
  const copy = notificationCopy[type];
  const read = isRead || state.read;

  return (
    <article
      className={`grid gap-4 border-b border-[var(--border)] px-5 py-5 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] ${
        read ? "" : "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
      }`}
    >
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          type === "submission_approved"
            ? "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]"
            : "bg-[var(--surface-subtle)] text-[var(--muted)]"
        }`}
      >
        {type === "submission_approved" ? (
          <CheckmarkCircle20 aria-hidden="true" />
        ) : (
          <Bell20 aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-medium">{copy.title}</h2>
          {!read ? (
            <span className="size-2 rounded-full bg-[var(--accent)]">
              <span className="sr-only">Unread</span>
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{copy.detail}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {campaignTitle ? `${campaignTitle} · ` : ""}
          {createdLabel}
        </p>
        {state.error ? (
          <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        {!read ? (
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="ghost"
              color="gray"
              size="1"
              loading={pending}
              disabled={pending}
            >
              Mark read
            </Button>
          </form>
        ) : null}
        {campaignSlug ? (
          <Link
            href={`/tasks/${campaignSlug}`}
            className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--accent)]"
            aria-label={`Open ${campaignTitle ?? "task"}`}
          >
            <ArrowRight20 aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
