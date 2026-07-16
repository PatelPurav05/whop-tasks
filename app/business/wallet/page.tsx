import Link from "next/link";
import { Badge, Button } from "@whop/react/components";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessEmptyState } from "@/components/business/empty-state";
import {
  formatDateTime,
  formatMoney,
} from "@/components/business/format";
import { getBusinessWalletHistory } from "@/app/business/data";
import { requireBusinessUserId } from "@/app/business/require-user";

const transactionLabels = {
  demo_grant: "Funds added",
  escrow_reservation: "Campaign escrow funded",
  payout: "Task payout received",
  refund: "Unused escrow refunded",
} as const;

export default async function BusinessWalletPage() {
  const userId = await requireBusinessUserId("/business/wallet");
  const wallet = await getBusinessWalletHistory(userId);

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <BusinessPageHeader
        eyebrow="Business wallet"
        title={formatMoney(wallet.balanceCents)}
        description="Available funds. Publishing reserves the full campaign budget, approvals pay from escrow, and archiving returns anything unused."
        actions={
          <Button asChild color="gray" variant="ghost">
            <Link href="/business">Back to campaigns</Link>
          </Button>
        }
      />

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-[24px] leading-[27px] font-medium">
            Wallet history
          </h2>
          <p className="mt-2 text-[15px] leading-[18px] text-current/60">
            An immutable record of every change to your available balance.
          </p>
        </div>

        {wallet.items.length === 0 ? (
          <BusinessEmptyState
            title="No wallet activity yet"
            description="Wallet credits, campaign funding, payouts, and refunds will appear here."
          />
        ) : (
          <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
            {wallet.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] leading-[18px] font-medium">
                      {transactionLabels[item.kind]}
                    </p>
                    <Badge
                      color={item.amountCents > 0 ? "success" : "gray"}
                      variant="soft"
                    >
                      {item.kind.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-[12px] leading-[15px] text-current/55">
                    {item.campaignTitle
                      ? `${item.campaignTitle} · `
                      : ""}
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <p
                  className={`text-[17px] leading-[21px] font-medium tabular-nums sm:text-right ${
                    item.amountCents > 0
                      ? "text-green-700 dark:text-green-300"
                      : "text-current"
                  }`}
                >
                  {item.amountCents > 0 ? "+" : ""}
                  {formatMoney(item.amountCents)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
