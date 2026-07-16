import { Badge } from "@whop/react/components";

type Status =
  | "active"
  | "approved"
  | "cancelled"
  | "changes_requested"
  | "completed"
  | "expired"
  | "pending"
  | "rejected"
  | "submitted";

const statusDetails: Record<
  Status,
  {
    label: string;
    color: "gray" | "info" | "success" | "warning" | "danger";
  }
> = {
  active: { label: "Claimed", color: "info" },
  approved: { label: "Approved and paid", color: "success" },
  cancelled: { label: "Cancelled", color: "gray" },
  changes_requested: { label: "Changes requested", color: "warning" },
  completed: { label: "Completed", color: "success" },
  expired: { label: "Expired", color: "danger" },
  pending: { label: "Under review", color: "info" },
  rejected: { label: "Rejected", color: "danger" },
  submitted: { label: "Under review", color: "info" },
};

export function StatusBadge({ status }: { status: Status }) {
  const details = statusDetails[status];

  return (
    <Badge color={details.color} variant="soft" size="1">
      {details.label}
    </Badge>
  );
}
