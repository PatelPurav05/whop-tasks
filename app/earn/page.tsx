import { Button } from "@whop/react/components";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EarnerTaskRow } from "@/components/earn/earner-task-row";
import { formatMoney } from "@/components/shared/format";
import { ProductShell } from "@/components/shared/product-shell";
import { getCurrentSession } from "@/lib/permissions";
import { getUserBalance } from "@/lib/services/ledger";
import { getEarnerTasks, getEarningsHistory } from "./data";

export const metadata: Metadata = {
  title: "Earn workspace",
};

export default async function EarnPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/earn");
  }

  const [tasks, payouts, balance] = await Promise.all([
    getEarnerTasks(session.user.id),
    getEarningsHistory(session.user.id),
    getUserBalance(session.user.id),
  ]);
  const needsAction = tasks.filter(
    (task) =>
      task.claim.status === "active" ||
      task.submission?.status === "changes_requested",
  );
  const underReview = tasks.filter(
    (task) => task.submission?.status === "pending",
  );
  const history = tasks.filter(
    (task) =>
      task.claim.status === "expired" ||
      task.claim.status === "cancelled" ||
      task.submission?.status === "approved" ||
      task.submission?.status === "rejected",
  );
  const totalEarned = payouts.reduce(
    (sum, payout) => sum + payout.amountCents,
    0,
  );

  return (
    <ProductShell active="earn">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Earn workspace
            </p>
            <h1 className="mt-2 text-[32px] leading-[35px] font-medium">
              Keep your work moving
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              Submit proof before claims expire and respond to feedback here.
            </p>
          </div>
          <Button asChild variant="solid" color="orange" size="3">
            <Link href="/">Find tasks</Link>
          </Button>
        </div>

        <dl className="mt-8 grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:grid-cols-3">
          <div className="border-b border-[var(--border)] px-5 py-4 sm:border-r sm:border-b-0">
            <dt className="text-sm text-[var(--muted)]">Needs action</dt>
            <dd className="mt-1 text-[24px] leading-[27px] font-medium">
              {needsAction.length}
            </dd>
          </div>
          <div className="border-b border-[var(--border)] px-5 py-4 sm:border-r sm:border-b-0">
            <dt className="text-sm text-[var(--muted)]">Under review</dt>
            <dd className="mt-1 text-[24px] leading-[27px] font-medium">
              {underReview.length}
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-sm text-[var(--muted)]">Earned total</dt>
            <dd className="mt-1 text-[24px] leading-[27px] font-medium">
              {formatMoney(totalEarned)}
            </dd>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatMoney(balance)} current wallet
            </p>
          </div>
        </dl>

        <section className="mt-10" aria-labelledby="action-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="action-heading"
              className="text-[24px] leading-[27px] font-medium"
            >
              Needs action
            </h2>
            <span className="text-sm text-[var(--muted)]">
              {needsAction.length}
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {needsAction.length > 0 ? (
              needsAction.map((task) => (
                <EarnerTaskRow key={task.claim.id} task={task} />
              ))
            ) : (
              <div className="py-8 text-center">
                <h3 className="font-medium">You are caught up</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  New claims and requested changes will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {underReview.length > 0 ? (
          <section className="mt-10" aria-labelledby="review-heading">
            <h2
              id="review-heading"
              className="text-[24px] leading-[27px] font-medium"
            >
              Under review
            </h2>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              {underReview.map((task) => (
                <EarnerTaskRow key={task.claim.id} task={task} />
              ))}
            </div>
          </section>
        ) : null}

        {history.length > 0 ? (
          <section className="mt-10" aria-labelledby="history-heading">
            <h2
              id="history-heading"
              className="text-[24px] leading-[27px] font-medium"
            >
              Recent history
            </h2>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              {history.slice(0, 8).map((task) => (
                <EarnerTaskRow key={task.claim.id} task={task} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ProductShell>
  );
}
