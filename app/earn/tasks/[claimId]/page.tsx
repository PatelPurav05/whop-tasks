import { ArrowLeft20, Clock20 } from "@frosted-ui/icons";
import { Badge } from "@whop/react/components";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProofForm } from "@/components/earn/proof-form";
import {
  formatDate,
  formatMoney,
  formatRelativeDeadline,
} from "@/components/shared/format";
import { ProductShell } from "@/components/shared/product-shell";
import { SubmittedProofAnswer } from "@/components/shared/submitted-proof-answer";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentSession } from "@/lib/permissions";
import { getClaimWorkspace } from "@/app/earn/data";

export const metadata: Metadata = {
  title: "Task proof",
};

export default async function ClaimWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await getCurrentSession();
  const { claimId } = await params;
  const query = await searchParams;

  if (!session) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(`/earn/tasks/${claimId}`)}`,
    );
  }

  const workspace = await getClaimWorkspace(claimId, session.user.id);
  if (!workspace) {
    notFound();
  }

  const { claim, campaign, businessName, requirements, submission, answers, filesById } =
    workspace;
  const answerMap = Object.fromEntries(
    answers.map((answer) => [answer.proofRequirementId, answer.value]),
  );
  const canSubmit =
    (claim.status === "active" && !submission) ||
    submission?.status === "changes_requested";
  const status = submission?.status ?? claim.status;
  const timeline = [
    {
      label: "Claimed",
      detail: formatDate(claim.claimedAt),
      done: true,
    },
    {
      label: "Under review",
      detail: submission ? formatDate(submission.submittedAt) : "Submit proof",
      done: Boolean(submission),
    },
    {
      label: "Changes requested",
      detail:
        submission?.status === "changes_requested"
          ? "Revision needed"
          : "Only if the reviewer needs more",
      done:
        submission?.status === "changes_requested" ||
        (submission?.version ?? 1) > 1,
    },
    {
      label: "Approved and paid",
      detail:
        submission?.status === "approved"
          ? formatMoney(campaign.rewardCents)
          : "Paid after approval",
      done: submission?.status === "approved",
    },
  ];

  return (
    <ProductShell active="earn">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/earn"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft20 aria-hidden="true" />
          Back to My tasks
        </Link>

        {query.submitted === "1" ? (
          <div
            role="status"
            className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,var(--border))] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-4 py-3 text-sm text-[var(--success)]"
          >
            Proof submitted. The business has been notified.
          </div>
        ) : null}

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <Badge color="gray" variant="soft">
                {campaign.category}
              </Badge>
            </div>
            <h1 className="mt-4 text-[32px] leading-[35px] font-medium">
              {campaign.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {businessName} · {formatMoney(campaign.rewardCents)} on approval
            </p>

            {submission?.status === "changes_requested" ? (
              <section className="mt-7 rounded-2xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-5">
                <p className="text-sm font-medium text-[var(--warning)]">
                  Changes requested
                </p>
                <h2 className="mt-2 text-[20px] leading-[23px] font-medium">
                  Review the feedback, then resubmit
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-5">
                  {submission.reviewFeedback}
                </p>
              </section>
            ) : submission?.status === "rejected" ? (
              <section className="mt-7 rounded-2xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-5">
                <p className="text-sm font-medium text-[var(--danger)]">
                  Submission rejected
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-5">
                  {submission.rejectionReason}
                </p>
              </section>
            ) : null}

            {canSubmit ? (
              <section
                className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
                aria-labelledby="proof-form-heading"
              >
                <div className="mb-7">
                  <h2
                    id="proof-form-heading"
                    className="text-[24px] leading-[27px] font-medium"
                  >
                    {submission ? "Revise your proof" : "Submit proof"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Complete every required field. Answers stay in the order set
                    by the business.
                  </p>
                </div>
                <ProofForm
                  claimId={claim.id}
                  requirements={requirements}
                  existingAnswers={answerMap}
                  existingFiles={filesById}
                  isRevision={Boolean(submission)}
                />
              </section>
            ) : submission ? (
              <section className="mt-8" aria-labelledby="submitted-proof-heading">
                <h2
                  id="submitted-proof-heading"
                  className="text-[24px] leading-[27px] font-medium"
                >
                  Submitted proof
                </h2>
                <dl className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {requirements.map((requirement, index) => {
                    const value = answerMap[requirement.id];
                    const file =
                      typeof value === "string"
                        ? (filesById[value] ?? null)
                        : null;

                    return (
                      <div
                        key={requirement.id}
                        className="grid gap-3 py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8"
                      >
                        <dt>
                          <p className="text-[15px] leading-[18px] font-medium">
                            {index + 1}. {requirement.label}
                          </p>
                          {requirement.helpText ? (
                            <p className="mt-2 text-[12px] leading-[15px] text-[var(--muted)]">
                              {requirement.helpText}
                            </p>
                          ) : null}
                        </dt>
                        <dd className="min-w-0 text-[15px] leading-[21px] text-[var(--foreground)]">
                          <SubmittedProofAnswer
                            fieldType={requirement.fieldType}
                            value={value}
                            file={file}
                          />
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ) : (
              <section className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
                <h2 className="text-[20px] leading-[23px] font-medium">
                  This claim is {claim.status}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Proof can no longer be submitted for this slot.
                </p>
              </section>
            )}
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-sm">
              <Clock20 aria-hidden="true" className="text-[var(--muted)]" />
              <span className="font-medium">
                {claim.status === "active"
                  ? `Proof ${formatRelativeDeadline(claim.expiresAt)}`
                  : `Campaign ${formatRelativeDeadline(campaign.deadline)}`}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Claim deadline: {formatDate(claim.expiresAt)}
            </p>

            <h2 className="mt-7 text-sm font-medium">Progress</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((step, index) => (
                <li key={step.label} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-medium ${
                      step.done
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                    }`}
                  >
                    {step.done ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-7 border-t border-[var(--border)] pt-5">
              <p className="text-xs text-[var(--muted)]">Reward on approval</p>
              <p className="mt-1 text-[24px] leading-[27px] font-medium">
                {formatMoney(campaign.rewardCents)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </ProductShell>
  );
}
