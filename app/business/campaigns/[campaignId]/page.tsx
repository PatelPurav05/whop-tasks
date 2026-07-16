import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Progress } from "@whop/react/components";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CampaignActions } from "@/components/business/campaign-actions";
import { BusinessEmptyState } from "@/components/business/empty-state";
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/components/business/format";
import { StatusBadge } from "@/components/business/status-badge";
import { getBusinessCampaign } from "@/app/business/data";
import { requireBusinessUserId } from "@/app/business/require-user";

export default async function CampaignManagementPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const userId = await requireBusinessUserId(
    `/business/campaigns/${campaignId}`,
  );
  const detail = await getBusinessCampaign(campaignId, userId);

  if (!detail) {
    notFound();
  }

  const { campaign } = detail;
  const occupiedPercent = Math.min(
    (campaign.claimedSlots / campaign.slotCapacity) * 100,
    100,
  );

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <BusinessPageHeader
        eyebrow="Campaign management"
        title={campaign.title}
        description={campaign.description}
        actions={
          <>
            <Button asChild color="gray" variant="ghost">
              <Link href="/business">All campaigns</Link>
            </Button>
            {campaign.status === "active" ? (
              <Button asChild color="orange" variant="soft">
                <Link href={`/tasks/${campaign.slug}`}>View public task</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={campaign.status} />
        <Badge color="gray" variant="soft">
          {campaign.category}
        </Badge>
        <span className="text-[12px] leading-[15px] text-current/55">
          Deadline {formatDate(campaign.deadline)}
        </span>
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="border-y border-black/10 py-6 dark:border-white/12">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[12px] leading-[15px] text-current/55">
                  Capacity in use
                </p>
                <p className="mt-1 text-[24px] leading-[27px] font-medium tabular-nums">
                  {campaign.claimedSlots} of {campaign.slotCapacity} slots
                </p>
              </div>
              <p className="text-right text-[12px] leading-[15px] text-current/55">
                {formatMoney(campaign.rewardCents)} per approval
              </p>
            </div>
            <Progress
              value={occupiedPercent}
              max={100}
              color="orange"
              size="3"
              className="mt-4"
              aria-label={`${campaign.claimedSlots} of ${campaign.slotCapacity} campaign slots occupied`}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-[20px] leading-[23px] font-medium">
              Instructions
            </h2>
            <p className="mt-3 max-w-[72ch] whitespace-pre-wrap text-[15px] leading-[21px] text-current/70">
              {campaign.instructions}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-[20px] leading-[23px] font-medium">
              Proof requirements
            </h2>
            <ol className="mt-3 divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
              {detail.proofRequirements.map((requirement, index) => (
                <li
                  key={requirement.id}
                  className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center"
                >
                  <div>
                    <p className="text-[15px] leading-[18px] font-medium">
                      {index + 1}. {requirement.label}
                    </p>
                    {requirement.helpText ? (
                      <p className="mt-1 text-[12px] leading-[15px] text-current/55">
                        {requirement.helpText}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[12px] leading-[15px] text-current/55 sm:text-right">
                    {requirement.fieldType.replaceAll("_", " ")}
                    {requirement.required ? " · Required" : " · Optional"}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          <dl className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[12px] leading-[15px] text-current/55">
                Escrow remaining
              </dt>
              <dd className="text-[15px] leading-[18px] font-medium tabular-nums">
                {formatMoney(detail.escrowCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[12px] leading-[15px] text-current/55">
                Under review
              </dt>
              <dd className="text-[15px] leading-[18px] font-medium">
                {campaign.pendingReviewCount}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[12px] leading-[15px] text-current/55">
                Approved
              </dt>
              <dd className="text-[15px] leading-[18px] font-medium">
                {campaign.approvedCount}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[12px] leading-[15px] text-current/55">
                Claim window
              </dt>
              <dd className="text-[15px] leading-[18px] font-medium">
                {campaign.claimWindowHours} hours
              </dd>
            </div>
          </dl>
          <CampaignActions
            campaignId={campaign.id}
            status={campaign.status}
          />
        </aside>
      </section>

      <section className="mt-12">
        <div className="mb-4">
          <h2 className="text-[24px] leading-[27px] font-medium">
            Submissions
          </h2>
          <p className="mt-2 text-[15px] leading-[18px] text-current/60">
            Review structured evidence before any reward leaves escrow.
          </p>
        </div>

        {detail.submissions.length === 0 ? (
          <BusinessEmptyState
            title="No proof submitted yet"
            description="Claims and completed proof will appear here. Funds remain protected in escrow until you approve."
          />
        ) : (
          <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
            {detail.submissions.map((submission) => (
              <article
                key={submission.id}
                className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-center"
              >
                <div>
                  <p className="text-[15px] leading-[18px] font-medium">
                    {submission.earnerName}
                  </p>
                  <p className="mt-1 text-[12px] leading-[15px] text-current/55">
                    Version {submission.version} · Submitted{" "}
                    {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <StatusBadge status={submission.status} />
                <Button
                  asChild
                  color={submission.status === "pending" ? "orange" : "gray"}
                  variant="soft"
                >
                  <Link href={`/business/submissions/${submission.id}`}>
                    {submission.status === "pending"
                      ? "Review submission"
                      : "View submission"}
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
