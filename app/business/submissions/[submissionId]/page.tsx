import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@whop/react/components";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { SubmissionReviewPanel } from "@/components/business/submission-review-panel";
import { getSubmissionForReview } from "@/app/business/data";
import { requireBusinessUserId } from "@/app/business/require-user";

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const userId = await requireBusinessUserId(
    `/business/submissions/${submissionId}`,
  );
  const submission = await getSubmissionForReview(submissionId, userId);

  if (!submission) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <BusinessPageHeader
        eyebrow="Submission review"
        title={submission.campaignTitle}
        description="Compare each answer with the campaign requirements, then choose one clear outcome."
        actions={
          <Button asChild color="gray" variant="ghost">
            <Link href={`/business/campaigns/${submission.campaignId}`}>
              Back to campaign
            </Link>
          </Button>
        }
      />
      <div className="mt-8">
        <SubmissionReviewPanel submission={submission} />
      </div>
    </main>
  );
}
