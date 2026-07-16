"use client";

import { Button } from "@whop/react/components";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-[var(--danger)]">
          Something went wrong
        </p>
        <h1 className="mt-2 text-[32px] leading-[35px] font-medium">
          This page could not load
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Your data is unchanged. Try loading the page again.
        </p>
        <Button
          type="button"
          variant="solid"
          color="orange"
          size="3"
          className="mt-6"
          onClick={reset}
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
