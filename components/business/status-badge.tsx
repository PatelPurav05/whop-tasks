import { Badge } from "@whop/react/components";
import type {
  CampaignStatus,
  SubmissionStatus,
} from "@/components/business/types";

const labels: Record<CampaignStatus | SubmissionStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  pending: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved and paid",
  rejected: "Rejected",
};

const colors: Record<
  CampaignStatus | SubmissionStatus,
  "gray" | "success" | "warning" | "danger" | "info"
> = {
  draft: "gray",
  active: "success",
  completed: "info",
  archived: "gray",
  pending: "warning",
  changes_requested: "info",
  approved: "success",
  rejected: "danger",
};

export function StatusBadge({
  status,
}: {
  status: CampaignStatus | SubmissionStatus;
}) {
  return (
    <Badge color={colors[status]} variant="soft" size="1">
      {labels[status]}
    </Badge>
  );
}
