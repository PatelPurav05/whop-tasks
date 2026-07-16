import Link from "next/link";
import { Button } from "@whop/react/components";
import { Plus16, Wallet16 } from "@frosted-ui/icons";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CampaignTable } from "@/components/business/campaign-table";
import { BusinessEmptyState } from "@/components/business/empty-state";
import {
  formatDateTime,
  formatMoney,
} from "@/components/business/format";
import { getBusinessDashboard } from "@/app/business/data";
import { requireBusinessUserId } from "@/app/business/require-user";

export default async function BusinessDashboardPage() {
  const userId = await requireBusinessUserId("/business");
  const dashboard = await getBusinessDashboard(userId);
  const activeCampaigns = dashboard.campaigns.filter(
    (campaign) => campaign.status === "active",
  ).length;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <BusinessPageHeader
        eyebrow="Business workspace"
        title="Campaigns"
        description="Fund work, track capacity, and keep every submission moving toward a decision."
        actions={
          <>
            <Button asChild color="gray" variant="soft">
              <Link href="/business/wallet">
                <Wallet16 aria-hidden="true" />
                Wallet
              </Link>
            </Button>
            <Button asChild color="orange" variant="solid">
              <Link href="/business/campaigns/new">
                <Plus16 aria-hidden="true" />
                Create campaign
              </Link>
            </Button>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-black/10 py-6 dark:border-white/12 sm:grid-cols-4">
        <div>
          <dt className="text-[12px] leading-[15px] text-current/55">
            Wallet available
          </dt>
          <dd className="mt-1 text-[20px] leading-[23px] font-medium tabular-nums">
            {formatMoney(dashboard.balanceCents)}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[15px] text-current/55">
            In escrow
          </dt>
          <dd className="mt-1 text-[20px] leading-[23px] font-medium tabular-nums">
            {formatMoney(dashboard.escrowCents)}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[15px] text-current/55">
            Active campaigns
          </dt>
          <dd className="mt-1 text-[20px] leading-[23px] font-medium tabular-nums">
            {activeCampaigns}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] leading-[15px] text-current/55">
            Awaiting review
          </dt>
          <dd className="mt-1 text-[20px] leading-[23px] font-medium tabular-nums">
            {dashboard.pendingReviews.length}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] leading-[27px] font-medium">
              Review queue
            </h2>
            <p className="mt-2 text-[15px] leading-[18px] text-current/60">
              Oldest work should get a decision first.
            </p>
          </div>
        </div>

        {dashboard.pendingReviews.length === 0 ? (
          <BusinessEmptyState
            title="No submissions need review"
            description="New proof will appear here as soon as an earner submits or resubmits work."
          />
        ) : (
          <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
            {dashboard.pendingReviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] leading-[18px] font-medium">
                    {review.campaignTitle}
                  </p>
                  <p className="mt-1 text-[12px] leading-[15px] text-current/55">
                    {review.earnerName} · Version {review.version} ·{" "}
                    {formatDateTime(review.submittedAt)}
                  </p>
                </div>
                <Button asChild color="orange" variant="soft">
                  <Link href={`/business/submissions/${review.id}`}>
                    Review submission
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-[24px] leading-[27px] font-medium">
            All campaigns
          </h2>
          <p className="mt-2 text-[15px] leading-[18px] text-current/60">
            Drafts keep funds available. Live campaigns reserve their full
            budget in escrow.
          </p>
        </div>
        <CampaignTable campaigns={dashboard.campaigns} />
      </section>
    </main>
  );
}
