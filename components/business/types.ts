export type ActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

export type CampaignStatus = "draft" | "active" | "completed" | "archived";
export type SubmissionStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected";
export type ProofFieldType =
  | "short_text"
  | "long_text"
  | "url"
  | "file"
  | "image"
  | "confirmation";

export type CampaignDraftInput = {
  title: string;
  description: string;
  category: string;
  instructions: string;
  rewardCents: number;
  slotCapacity: number;
  claimWindowHours: number;
  deadline: string;
  proofRequirements: Array<{
    key: string;
    label: string;
    helpText?: string;
    fieldType: ProofFieldType;
    required: boolean;
    config: {
      maxLength?: number;
      acceptedMimeTypes?: string[];
    };
  }>;
};

export type BusinessCampaignSummary = {
  id: string;
  title: string;
  slug: string;
  status: CampaignStatus;
  rewardCents: number;
  slotCapacity: number;
  deadline: string;
  updatedAt: string;
  claimedSlots: number;
  submissionCount: number;
  pendingReviewCount: number;
  approvedCount: number;
};

export type PendingReviewSummary = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  earnerName: string;
  version: number;
  submittedAt: string;
};

export type BusinessDashboardData = {
  balanceCents: number;
  escrowCents: number;
  campaigns: BusinessCampaignSummary[];
  pendingReviews: PendingReviewSummary[];
};

export type BusinessCampaignDetail = {
  campaign: BusinessCampaignSummary & {
    description: string;
    category: string;
    instructions: string;
    claimWindowHours: number;
    publishedAt: string | null;
    closedAt: string | null;
  };
  escrowCents: number;
  proofRequirements: Array<{
    id: string;
    label: string;
    helpText: string | null;
    fieldType: ProofFieldType;
    required: boolean;
  }>;
  submissions: Array<{
    id: string;
    earnerName: string;
    status: SubmissionStatus;
    version: number;
    submittedAt: string;
    reviewedAt: string | null;
  }>;
};

export type SubmissionReviewDetail = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  rewardCents: number;
  earnerName: string;
  earnerEmail: string;
  status: SubmissionStatus;
  version: number;
  submittedAt: string;
  reviewFeedback: string | null;
  rejectionReason: string | null;
  answers: Array<{
    id: string;
    label: string;
    helpText: string | null;
    fieldType: ProofFieldType;
    value: unknown;
    file: {
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
    } | null;
  }>;
};

export type WalletHistoryItem = {
  id: string;
  kind: "demo_grant" | "escrow_reservation" | "payout" | "refund";
  amountCents: number;
  campaignTitle: string | null;
  createdAt: string;
};
