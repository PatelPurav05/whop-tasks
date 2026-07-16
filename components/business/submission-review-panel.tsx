"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, TextArea } from "@whop/react/components";
import {
  reviewSubmissionAction,
  type ReviewActionInput,
} from "@/app/business/actions";
import {
  formatDateTime,
  formatMoney,
} from "@/components/business/format";
import { ProofFilePreview } from "@/components/shared/proof-file-preview";
import { StatusBadge } from "@/components/business/status-badge";
import type {
  ActionResult,
  SubmissionReviewDetail,
} from "@/components/business/types";

type FeedbackMode = "approve" | "changes" | "reject" | null;

function renderAnswerValue(answer: SubmissionReviewDetail["answers"][number]) {
  if (answer.file) {
    return <ProofFilePreview file={answer.file} />;
  }
  if (answer.fieldType === "confirmation") {
    return answer.value === true ? "Confirmed" : "Not confirmed";
  }
  if (answer.fieldType === "url" && typeof answer.value === "string") {
    return (
      <a
        href={answer.value}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[var(--brand-indigo)] underline underline-offset-4 dark:text-[var(--brand-cerulean)]"
      >
        {answer.value}
      </a>
    );
  }
  if (typeof answer.value === "string") {
    return <span className="whitespace-pre-wrap">{answer.value}</span>;
  }
  if (answer.value === null || answer.value === undefined) {
    return <span className="text-current/45">No answer provided</span>;
  }
  return (
    <span className="whitespace-pre-wrap">
      {JSON.stringify(answer.value, null, 2)}
    </span>
  );
}

export function SubmissionReviewPanel({
  submission,
}: {
  submission: SubmissionReviewDetail;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<FeedbackMode>(null);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(input: ReviewActionInput): void {
    setResult(null);
    startTransition(async () => {
      const nextResult = await reviewSubmissionAction(input);
      setResult(nextResult);
      if (nextResult.ok) {
        setMode(null);
        router.refresh();
      }
    });
  }

  function approve(): void {
    setMode("approve");
    setResult(null);
  }

  function confirmApproval(): void {
    decide({
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "approve",
    });
  }

  function submitFeedback(): void {
    const normalized = feedback.trim();
    if (normalized.length < 3) {
      setResult({
        ok: false,
        message:
          mode === "reject"
            ? "Add a clear rejection reason"
            : "Tell the earner what needs to change",
      });
      return;
    }

    if (mode === "reject") {
      decide({
        submissionId: submission.id,
        expectedVersion: submission.version,
        decision: "reject",
        reason: normalized,
      });
      return;
    }
    decide({
      submissionId: submission.id,
      expectedVersion: submission.version,
      decision: "request_changes",
      feedback: normalized,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5 dark:border-white/12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={submission.status} />
              <span className="text-[12px] leading-[15px] text-current/55">
                Version {submission.version}
              </span>
            </div>
            <h2 className="mt-3 text-[24px] leading-[27px] font-medium">
              Proof from {submission.earnerName}
            </h2>
            <p className="mt-2 text-[12px] leading-[15px] text-current/55">
              Submitted {formatDateTime(submission.submittedAt)} ·{" "}
              {submission.earnerEmail}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-black/10 dark:divide-white/12">
          {submission.answers.map((answer, index) => (
            <div
              key={answer.id}
              className="grid gap-3 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
            >
              <dt>
                <p className="text-[15px] leading-[18px] font-medium">
                  {index + 1}. {answer.label}
                </p>
                {answer.helpText ? (
                  <p className="mt-2 text-[12px] leading-[15px] text-current/50">
                    {answer.helpText}
                  </p>
                ) : null}
              </dt>
              <dd className="min-w-0 text-[15px] leading-[21px]">
                {renderAnswerValue(answer)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="border-y border-black/10 py-5 dark:border-white/12">
          <p className="text-[12px] leading-[15px] text-current/55">
            Approval payout
          </p>
          <p className="mt-1 text-[24px] leading-[27px] font-medium tabular-nums">
            {formatMoney(submission.rewardCents)}
          </p>
          <p className="mt-2 text-[12px] leading-[15px] text-current/55">
            Paid from campaign escrow after the server confirms approval.
          </p>
        </div>

        {submission.status === "pending" ? (
          <div className="mt-5 flex flex-col gap-3">
            <Button
              type="button"
              color="orange"
              variant="solid"
              className="w-full"
              disabled={isPending}
              loading={isPending}
              onClick={approve}
            >
              Approve and pay
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                color="info"
                variant="soft"
                disabled={isPending}
                onClick={() => {
                  setMode("changes");
                  setFeedback("");
                  setResult(null);
                }}
              >
                Request changes
              </Button>
              <Button
                type="button"
                color="danger"
                variant="soft"
                disabled={isPending}
                onClick={() => {
                  setMode("reject");
                  setFeedback("");
                  setResult(null);
                }}
              >
                Reject
              </Button>
            </div>

            {mode === "approve" ? (
              <div className="mt-5 rounded-xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--accent)_24%,transparent)]">
                <p className="font-medium">Confirm approval and payout</p>
                <p className="mt-2 text-[12px] leading-[17px] text-current/60">
                  {formatMoney(submission.rewardCents)} will move from campaign
                  escrow to {submission.earnerName}. This cannot be undone.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    color="orange"
                    variant="solid"
                    disabled={isPending}
                    loading={isPending}
                    onClick={confirmApproval}
                  >
                    Confirm and pay
                  </Button>
                  <Button
                    type="button"
                    color="gray"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => setMode(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : mode ? (
              <div className="mt-5 border-t border-black/10 pt-5 dark:border-white/12">
                <label
                  htmlFor="review-feedback"
                  className="mb-2 block text-[15px] leading-[18px] font-medium"
                >
                  {mode === "reject"
                    ? "Reason for rejection"
                    : "What should change?"}
                </label>
                <TextArea
                  id="review-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={5}
                  maxLength={2_000}
                  placeholder={
                    mode === "reject"
                      ? "Explain why this work cannot be accepted."
                      : "Give specific, actionable feedback."
                  }
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    color={mode === "reject" ? "danger" : "info"}
                    variant="solid"
                    disabled={isPending}
                    loading={isPending}
                    onClick={submitFeedback}
                  >
                    {mode === "reject"
                      ? "Confirm rejection"
                      : "Send change request"}
                  </Button>
                  <Button
                    type="button"
                    color="gray"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => setMode(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-5">
            <Callout.Root color="gray" variant="soft">
              <Callout.Text>
                {submission.status === "approved"
                  ? "This reward has been paid. No further review action is available."
                  : submission.status === "changes_requested"
                    ? submission.reviewFeedback
                    : submission.rejectionReason}
              </Callout.Text>
            </Callout.Root>
          </div>
        )}

        {result ? (
          <div className="mt-4">
            <Callout.Root
              color={result.ok ? "success" : "danger"}
              variant="soft"
              role={result.ok ? "status" : "alert"}
            >
              <Callout.Text>{result.message}</Callout.Text>
            </Callout.Root>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
