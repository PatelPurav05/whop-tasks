import { ArrowRight20, Clock16 } from "@frosted-ui/icons";
import Link from "next/link";
import type { EarnerTask } from "@/app/earn/data";
import {
  formatMoney,
  formatRelativeDeadline,
} from "@/components/shared/format";
import { StatusBadge } from "@/components/shared/status-badge";

export function EarnerTaskRow({ task }: { task: EarnerTask }) {
  const status = task.submission?.status ?? task.claim.status;
  const actionLabel =
    status === "active"
      ? "Submit proof"
      : status === "changes_requested"
        ? "Revise proof"
        : "View details";

  return (
    <Link
      href={`/earn/tasks/${task.claim.id}`}
      className="group grid gap-4 border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-[var(--muted)]">
            {task.businessName}
          </span>
        </div>
        <h3 className="mt-2 truncate text-[20px] leading-[23px] font-medium group-hover:text-[var(--accent)]">
          {task.campaign.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
          <span>{formatMoney(task.campaign.rewardCents)} reward</span>
          <span className="flex items-center gap-1.5">
            <Clock16 aria-hidden="true" />
            {task.claim.status === "active"
              ? `Proof ${formatRelativeDeadline(task.claim.expiresAt)}`
              : `Campaign ${formatRelativeDeadline(task.campaign.deadline)}`}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm font-medium">{actionLabel}</span>
        <ArrowRight20
          aria-hidden="true"
          className="text-[var(--muted)] group-hover:text-[var(--accent)]"
        />
      </div>
    </Link>
  );
}
