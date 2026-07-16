"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Progress } from "@whop/react/components";
import { ChevronRight16 } from "@frosted-ui/icons";
import { BusinessEmptyState } from "@/components/business/empty-state";
import { formatDate, formatMoney } from "@/components/business/format";
import { StatusBadge } from "@/components/business/status-badge";
import type {
  BusinessCampaignSummary,
  CampaignStatus,
} from "@/components/business/types";

type CampaignFilter = "all" | CampaignStatus;

const filters: Array<{ value: CampaignFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function CampaignTable({
  campaigns,
}: {
  campaigns: BusinessCampaignSummary[];
}) {
  const [filter, setFilter] = useState<CampaignFilter>("all");

  if (campaigns.length === 0) {
    return (
      <BusinessEmptyState
        title="Launch your first campaign"
        description="Define the work, collect the right proof, and fund every available slot before it goes live."
        action={{ label: "Create campaign", href: "/business/campaigns/new" }}
      />
    );
  }

  const visibleCampaigns =
    filter === "all"
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === filter);

  return (
    <div>
      <div
        className="mb-4 flex gap-1 overflow-x-auto pb-1"
        aria-label="Filter campaigns by status"
      >
        {filters.map((item) => {
          const count =
            item.value === "all"
              ? campaigns.length
              : campaigns.filter(
                  (campaign) => campaign.status === item.value,
                ).length;
          return (
            <Button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              variant={filter === item.value ? "solid" : "soft"}
              color={filter === item.value ? "orange" : "gray"}
              size="1"
              className="shrink-0"
              aria-pressed={filter === item.value}
            >
              {item.label} {count}
            </Button>
          );
        })}
      </div>

      {visibleCampaigns.length === 0 ? (
        <BusinessEmptyState
          title={`No ${filter} campaigns`}
          description="Choose another status to keep managing your campaign portfolio."
        />
      ) : (
        <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
          {visibleCampaigns.map((campaign) => {
            const occupiedPercent = Math.min(
              (campaign.claimedSlots / campaign.slotCapacity) * 100,
              100,
            );

            return (
              <article
                key={campaign.id}
                className="group grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_160px_130px_36px] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/business/campaigns/${campaign.id}`}
                      className="truncate text-[17px] leading-[21px] font-medium underline-offset-4 hover:underline"
                    >
                      {campaign.title}
                    </Link>
                    <StatusBadge status={campaign.status} />
                    {campaign.pendingReviewCount > 0 ? (
                      <span className="text-[12px] leading-[15px] font-medium text-[var(--brand-vermilion)]">
                        {campaign.pendingReviewCount} to review
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12px] leading-[15px] text-current/60">
                    {formatMoney(campaign.rewardCents)} per task · Deadline{" "}
                    {formatDate(campaign.deadline)}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-[12px] leading-[15px] text-current/65">
                    <span>Capacity</span>
                    <span>
                      {campaign.claimedSlots}/{campaign.slotCapacity}
                    </span>
                  </div>
                  <Progress
                    value={occupiedPercent}
                    max={100}
                    color="orange"
                    size="2"
                    aria-label={`${campaign.claimedSlots} of ${campaign.slotCapacity} slots occupied`}
                  />
                </div>

                <dl className="grid grid-cols-2 gap-3 text-[12px] leading-[15px] sm:grid-cols-1 sm:gap-1">
                  <div className="flex justify-between gap-3">
                    <dt className="text-current/60">Submissions</dt>
                    <dd className="font-medium">{campaign.submissionCount}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-current/60">Approved</dt>
                    <dd className="font-medium">{campaign.approvedCount}</dd>
                  </div>
                </dl>

                <Button
                  asChild
                  variant="ghost"
                  color="gray"
                  className="hidden sm:inline-flex"
                  aria-label={`Manage ${campaign.title}`}
                >
                  <Link href={`/business/campaigns/${campaign.id}`}>
                    <ChevronRight16 aria-hidden="true" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
