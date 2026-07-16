"use client";

import { Button, Callout } from "@whop/react/components";

export default function BusinessError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center px-4 py-12 sm:px-6">
      <div className="w-full">
        <p className="text-[12px] leading-[15px] font-medium text-[var(--brand-vermilion)]">
          Business workspace
        </p>
        <h1 className="mt-3 text-[32px] leading-[35px] font-medium">
          We could not load this view
        </h1>
        <p className="mt-4 max-w-[65ch] text-[15px] leading-[20px] text-current/65">
          Your data was not changed. Retry the request, or return to the
          campaign list and continue from there.
        </p>
        <Callout.Root color="warning" variant="soft" className="mt-6">
          <Callout.Text>
            If a review changed in another tab, refreshing will load the latest
            version before you act.
          </Callout.Text>
        </Callout.Root>
        <Button
          type="button"
          color="orange"
          variant="solid"
          className="mt-6"
          onClick={reset}
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
