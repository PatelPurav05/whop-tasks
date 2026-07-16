import { ArrowRight20, Clock16 } from "@frosted-ui/icons";
import { Badge, Progress } from "@whop/react/components";
import Link from "next/link";
import type { MarketplaceTask } from "@/app/marketplace-data";
import {
  formatMoney,
  formatRelativeDeadline,
  getInitials,
} from "@/components/shared/format";

export function TaskCard({
  task,
  featured = false,
}: {
  task: MarketplaceTask;
  featured?: boolean;
}) {
  const remainingSlots = Math.max(task.slotCapacity - task.claimedSlots, 0);
  const filledPercent = Math.min(
    Math.round((task.claimedSlots / task.slotCapacity) * 100),
    100,
  );

  return (
    <Link
      href={`/tasks/${task.slug}`}
      className={`group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] ${
        featured ? "sm:p-6" : ""
      }`}
      aria-label={`${task.title}, ${formatMoney(task.rewardCents)} reward`}
    >
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--surface-subtle)] text-sm font-medium">
          {getInitials(task.owner.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="gray" variant="soft">
              {task.category}
            </Badge>
            {remainingSlots <= 2 && remainingSlots > 0 ? (
              <Badge color="warning" variant="soft">
                {remainingSlots} {remainingSlots === 1 ? "slot" : "slots"} left
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-3 text-[20px] leading-[23px] font-medium">
            {task.title}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-[68ch] text-sm leading-5 text-[var(--muted)]">
            {task.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium">{task.owner.name}</span>
            <span className="flex items-center gap-1.5 text-[var(--muted)]">
              <Clock16 aria-hidden="true" />
              {formatRelativeDeadline(task.deadline)}
            </span>
          </div>
        </div>
        <div className="hidden text-[var(--muted)] group-hover:text-[var(--accent)] sm:block">
          <ArrowRight20 aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-end gap-4 border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-xs text-[var(--muted)]">Reward</p>
          <p className="mt-1 text-[24px] leading-[27px] font-medium">
            {formatMoney(task.rewardCents)}
          </p>
        </div>
        <div className="ml-auto w-full max-w-44">
          <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
            <span>{remainingSlots} available</span>
            <span>{task.slotCapacity} total</span>
          </div>
          <Progress
            value={filledPercent}
            color="orange"
            size="2"
            aria-label={`${remainingSlots} of ${task.slotCapacity} slots available`}
          />
        </div>
      </div>
    </Link>
  );
}
