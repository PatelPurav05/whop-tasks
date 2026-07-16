"use client";

import { Button } from "@whop/react/components";
import { useActionState } from "react";
import {
  claimTaskAction,
  type ClaimTaskState,
} from "@/app/tasks/[slug]/actions";

const initialState: ClaimTaskState = { error: null };

export function ClaimTaskForm({
  campaignId,
  slug,
  disabled,
  disabledLabel,
}: {
  campaignId: string;
  slug: string;
  disabled: boolean;
  disabledLabel: string;
}) {
  const [state, action, pending] = useActionState(
    claimTaskAction,
    initialState,
  );

  return (
    <form action={action}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
      <Button
        type="submit"
        variant="solid"
        color="orange"
        size="3"
        className="w-full"
        disabled={disabled || pending}
        loading={pending}
      >
        {disabled ? disabledLabel : "Claim task"}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
