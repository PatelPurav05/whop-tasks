import { ArrowUpRight20, Wallet24 } from "@frosted-ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatDate,
  formatMoney,
} from "@/components/shared/format";
import { ProductShell } from "@/components/shared/product-shell";
import { getCurrentSession } from "@/lib/permissions";
import { getUserBalance } from "@/lib/services/ledger";
import { getEarningsHistory } from "../data";

export const metadata: Metadata = {
  title: "Earnings",
};

export default async function EarningsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/earn/earnings");
  }

  const [payouts, balance] = await Promise.all([
    getEarningsHistory(session.user.id),
    getUserBalance(session.user.id),
  ]);
  const totalEarned = payouts.reduce(
    (sum, payout) => sum + payout.amountCents,
    0,
  );

  return (
    <ProductShell active="earnings">
      <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="text-sm font-medium text-[var(--accent)]">Earnings</p>
        <h1 className="mt-2 text-[32px] leading-[35px] font-medium">
          Payout history
        </h1>
        <p className="mt-3 max-w-[68ch] text-[var(--muted)]">
          Every approved task creates an immutable demo-ledger entry.
        </p>

        <dl className="mt-8 grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:grid-cols-2">
          <div className="border-b border-[var(--border)] p-5 sm:border-r sm:border-b-0">
            <dt className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Wallet24 aria-hidden="true" />
              Current wallet
            </dt>
            <dd className="mt-3 text-[32px] leading-[35px] font-medium">
              {formatMoney(balance)}
            </dd>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Includes demo credits and approved earnings.
            </p>
          </div>
          <div className="p-5">
            <dt className="text-sm text-[var(--muted)]">Total task earnings</dt>
            <dd className="mt-3 text-[32px] leading-[35px] font-medium">
              {formatMoney(totalEarned)}
            </dd>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Across {payouts.length} approved{" "}
              {payouts.length === 1 ? "task" : "tasks"}.
            </p>
          </div>
        </dl>

        <section className="mt-10" aria-labelledby="transactions-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="transactions-heading"
              className="text-[24px] leading-[27px] font-medium"
            >
              Transactions
            </h2>
            <span className="text-sm text-[var(--muted)]">
              Newest first
            </span>
          </div>

          {payouts.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="grid gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {payout.campaignTitle ?? "Approved task"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Payout · {formatDate(payout.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    Funds received
                  </p>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="font-medium text-[var(--success)]">
                      +{formatMoney(payout.amountCents)}
                    </span>
                    {payout.campaignSlug ? (
                      <Link
                        href={`/tasks/${payout.campaignSlug}`}
                        aria-label={`View ${payout.campaignTitle ?? "task"}`}
                        className="text-[var(--muted)] hover:text-[var(--accent)]"
                      >
                        <ArrowUpRight20 aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
              <h3 className="text-[20px] leading-[23px] font-medium">
                Your first payout will appear here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Complete a task and receive business approval to create an
                earnings entry.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Browse funded tasks
              </Link>
            </div>
          )}
        </section>
      </div>
    </ProductShell>
  );
}
