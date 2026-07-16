import {
  ArrowLeft20,
  CheckmarkCircle20,
  Clock20,
  Document20,
} from "@frosted-ui/icons";
import { Badge, Button, Progress } from "@whop/react/components";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimTaskForm } from "@/components/marketplace/claim-task-form";
import {
  formatDate,
  formatMoney,
  formatRelativeDeadline,
  getInitials,
} from "@/components/shared/format";
import { ProductShell } from "@/components/shared/product-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentSession } from "@/lib/permissions";
import { getTaskDetail } from "@/app/marketplace-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const task = await getTaskDetail(slug);
  return {
    title: task?.campaign.title ?? "Task not found",
    description: task?.campaign.description,
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getCurrentSession();
  const task = await getTaskDetail(slug, session?.user.id);

  if (!task) {
    notFound();
  }

  const { campaign, owner, requirements, claimedSlots, currentClaim } = task;
  const remainingSlots = Math.max(campaign.slotCapacity - claimedSlots, 0);
  const filledPercent = Math.min(
    Math.round((claimedSlots / campaign.slotCapacity) * 100),
    100,
  );
  const hasOpenClaim =
    currentClaim?.status === "active" || currentClaim?.status === "submitted";
  const isOwner = session?.user.id === campaign.ownerId;
  const isUnavailable =
    campaign.status !== "active" ||
    campaign.deadline <= new Date() ||
    remainingSlots === 0 ||
    isOwner;
  const unavailableLabel = isOwner
    ? "This is your campaign"
    : campaign.status !== "active"
      ? "Task is closed"
      : remainingSlots === 0
        ? "All slots claimed"
        : "Deadline passed";

  return (
    <ProductShell active="marketplace">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft20 aria-hidden="true" />
          Back to marketplace
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="gray" variant="soft">
                {campaign.category}
              </Badge>
              <Badge
                color={remainingSlots > 0 ? "success" : "warning"}
                variant="soft"
              >
                {remainingSlots > 0 ? `${remainingSlots} slots open` : "Filled"}
              </Badge>
            </div>

            <h1 className="mt-4 max-w-3xl text-[32px] leading-[35px] font-medium">
              {campaign.title}
            </h1>
            <p className="mt-4 max-w-[70ch] text-[17px] leading-6 text-[var(--muted)]">
              {campaign.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--border)] py-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[var(--surface)] font-medium">
                  {getInitials(owner.name)}
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Posted by</p>
                  <p className="mt-0.5 font-medium">{owner.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock20 aria-hidden="true" className="text-[var(--muted)]" />
                <span>{formatRelativeDeadline(campaign.deadline)}</span>
                <span className="text-[var(--muted)]">
                  ({formatDate(campaign.deadline)})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckmarkCircle20
                  aria-hidden="true"
                  className="text-[var(--success)]"
                />
                Fully funded in demo escrow
              </div>
            </div>

            <section className="mt-9" aria-labelledby="instructions-heading">
              <h2
                id="instructions-heading"
                className="text-[24px] leading-[27px] font-medium"
              >
                What to do
              </h2>
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
                {campaign.instructions}
              </div>
            </section>

            <section className="mt-10" aria-labelledby="proof-heading">
              <h2
                id="proof-heading"
                className="text-[24px] leading-[27px] font-medium"
              >
                Proof required
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                You will complete these fields after claiming a slot.
              </p>
              <ol className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {requirements.map((requirement, index) => (
                  <li
                    key={requirement.id}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {requirement.label}
                        {requirement.required ? (
                          <span className="ml-1 text-[var(--accent)]">*</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {requirement.helpText ??
                          requirement.fieldType.replaceAll("_", " ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </article>

          <aside className="sticky top-24 hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:block">
            <p className="text-sm text-[var(--muted)]">Reward per approval</p>
            <p className="mt-1 text-[32px] leading-[35px] font-medium">
              {formatMoney(campaign.rewardCents)}
            </p>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
                <span>{remainingSlots} remaining</span>
                <span>{campaign.slotCapacity} funded</span>
              </div>
              <Progress
                value={filledPercent}
                color="orange"
                size="3"
                aria-label={`${remainingSlots} of ${campaign.slotCapacity} slots remain`}
              />
              <p className="mt-2 text-xs text-[var(--muted)]">
                {formatMoney(campaign.rewardCents * campaign.slotCapacity)} total
                campaign budget
              </p>
            </div>

            <div className="mt-6">
              {hasOpenClaim && currentClaim ? (
                <>
                  <StatusBadge status={currentClaim.status} />
                  <Button
                    asChild
                    variant="solid"
                    color="orange"
                    size="3"
                    className="mt-3 w-full"
                  >
                    <Link href={`/earn/tasks/${currentClaim.id}`}>
                      {currentClaim.status === "active"
                        ? "Continue to proof"
                        : "View submission"}
                    </Link>
                  </Button>
                </>
              ) : session ? (
                <ClaimTaskForm
                  campaignId={campaign.id}
                  slug={campaign.slug}
                  disabled={isUnavailable}
                  disabledLabel={unavailableLabel}
                />
              ) : (
                <Button
                  asChild
                  variant="solid"
                  color="orange"
                  size="3"
                  className="w-full"
                >
                  <Link
                    href={`/sign-in?callbackUrl=${encodeURIComponent(`/tasks/${campaign.slug}`)}`}
                  >
                    Sign in to claim
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-5 flex gap-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
              <Document20 className="shrink-0" aria-hidden="true" />
              You have {campaign.claimWindowHours} hours to submit after
              claiming. The campaign deadline can shorten that window.
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-[var(--border)] bg-[var(--surface)] p-3 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="shrink-0">
            <p className="text-xs text-[var(--muted)]">Reward</p>
            <p className="font-medium">{formatMoney(campaign.rewardCents)}</p>
          </div>
          <div className="min-w-0 flex-1">
            {hasOpenClaim && currentClaim ? (
              <Button
                asChild
                variant="solid"
                color="orange"
                size="3"
                className="w-full"
              >
                <Link href={`/earn/tasks/${currentClaim.id}`}>
                  {currentClaim.status === "active"
                    ? "Continue to proof"
                    : "View submission"}
                </Link>
              </Button>
            ) : session ? (
              <ClaimTaskForm
                campaignId={campaign.id}
                slug={campaign.slug}
                disabled={isUnavailable}
                disabledLabel={unavailableLabel}
              />
            ) : (
              <Button
                asChild
                variant="solid"
                color="orange"
                size="3"
                className="w-full"
              >
                <Link
                  href={`/sign-in?callbackUrl=${encodeURIComponent(`/tasks/${campaign.slug}`)}`}
                >
                  Sign in to claim
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </ProductShell>
  );
}
