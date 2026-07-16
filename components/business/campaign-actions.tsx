"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout } from "@whop/react/components";
import {
  archiveCampaignAction,
  publishCampaignAction,
} from "@/app/business/actions";
import type {
  ActionResult,
  CampaignStatus,
} from "@/components/business/types";

export function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);

  function publish(): void {
    setResult(null);
    startTransition(async () => {
      const nextResult = await publishCampaignAction(campaignId);
      setResult(nextResult);
      if (nextResult.ok) {
        router.refresh();
      }
    });
  }

  function archive(): void {
    setResult(null);
    startTransition(async () => {
      const nextResult = await archiveCampaignAction(campaignId);
      setResult(nextResult);
      if (nextResult.ok) {
        setIsConfirmingArchive(false);
        router.refresh();
      }
    });
  }

  if (status === "completed" || status === "archived") {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <Button
            type="button"
            color="orange"
            variant="solid"
            loading={isPending}
            disabled={isPending}
            onClick={publish}
          >
            Fund and publish
          </Button>
        ) : null}
        <Button
          type="button"
          color="danger"
          variant="soft"
          disabled={isPending}
          onClick={() => {
            setIsConfirmingArchive(true);
            setResult(null);
          }}
        >
          Archive campaign
        </Button>
      </div>
      {isConfirmingArchive ? (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--danger)_22%,transparent)]">
          <p className="font-medium">
            {status === "active" ? "Archive this campaign?" : "Archive this draft?"}
          </p>
          <p className="mt-2 text-[12px] leading-[17px] text-current/60">
            {status === "active"
              ? "Unused escrow will be refunded. Active claims without submissions will be cancelled."
              : "The draft will close without reserving any funds."}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              color="danger"
              variant="solid"
              disabled={isPending}
              loading={isPending}
              onClick={archive}
            >
              Confirm archive
            </Button>
            <Button
              type="button"
              color="gray"
              variant="ghost"
              disabled={isPending}
              onClick={() => setIsConfirmingArchive(false)}
            >
              Keep campaign
            </Button>
          </div>
        </div>
      ) : null}
      {result ? (
        <Callout.Root
          color={result.ok ? "success" : "danger"}
          variant="soft"
          role={result.ok ? "status" : "alert"}
        >
          <Callout.Text>{result.message}</Callout.Text>
        </Callout.Root>
      ) : null}
    </div>
  );
}
