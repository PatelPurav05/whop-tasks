"use client";

import { ChevronDown16 } from "@frosted-ui/icons";
import { DropdownMenu } from "@whop/react/components";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getInitials } from "@/components/shared/format";
import { authClient } from "@/lib/auth-client";

export function AccountButton({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  async function signOut(): Promise<void> {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger>
        <button
          type="button"
          aria-label={`Account menu for ${name}`}
          aria-expanded={open}
          className={`fui-reset flex min-h-9 max-w-44 items-center gap-2 rounded-xl px-1.5 py-1 transition-[background-color,box-shadow] duration-200 ${
            open
              ? "bg-[var(--surface-subtle)] ring-1 ring-black/6 dark:ring-white/10"
              : "hover:bg-[var(--surface-subtle)]"
          }`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-subtle))] text-xs font-medium text-[var(--accent)]">
            {getInitials(name)}
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
            {name}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="shrink-0 text-[var(--muted)]"
            aria-hidden="true"
          >
            <ChevronDown16 />
          </motion.span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        size="2"
        variant="solid"
        className="account-menu-content min-w-[220px]"
      >
        <div className="account-menu-header px-2.5 py-2">
          <p className="truncate text-[15px] leading-[18px] font-medium">
            {name}
          </p>
          <p className="mt-0.5 text-[12px] leading-[15px] text-[var(--muted)]">
            Signed in
          </p>
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          color="gray"
          disabled={isSigningOut}
          className="account-menu-action"
          onSelect={() => {
            void signOut();
          }}
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
