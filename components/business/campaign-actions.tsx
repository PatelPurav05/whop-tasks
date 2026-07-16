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
    const confirmed = window.confirm(
      status === "active"
        ? "Archive this campaign and refund all unused escrow? Active claims without submissions will be cancelled."
        : "Archive this draft?",
    );
    if (!confirmed) {
      return;
    }

    setResult(null);
    startTransition(async () => {
      const nextResult = await archiveCampaignAction(campaignId);
      setResult(nextResult);
      if (nextResult.ok) {
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
          onClick={archive}
        >
          Archive campaign
        </Button>
      </div>
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
