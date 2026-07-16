import {
  Bell20,
  Wallet20,
} from "@frosted-ui/icons";
import { Button } from "@whop/react/components";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/lib/permissions";
import { getUserBalance } from "@/lib/services/ledger";
import { listNotifications } from "@/lib/services/notifications";
import { formatMoney } from "./format";
import { AccountButton } from "./account-button";
import { BrandLogo } from "./brand-logo";
import { HeaderContext } from "./header-context";
import { NavigationItems } from "./navigation-items";
import { PageTransition } from "./page-transition";
import { ThemeToggle } from "./theme-toggle";

type ActiveArea =
  | "business"
  | "business-create"
  | "business-wallet"
  | "earn"
  | "earnings"
  | "marketplace"
  | "notifications";

export async function ProductShell({
  active,
  children,
  workspace = "earn",
  childHasMain = false,
}: {
  active: ActiveArea;
  children: ReactNode;
  workspace?: "business" | "earn";
  childHasMain?: boolean;
}) {
  const session = await getCurrentSession();
  const userData = session
    ? await Promise.all([
        getUserBalance(session.user.id),
        listNotifications(session.user.id, { limit: 100 }),
      ])
    : null;
  const balance = userData?.[0] ?? 0;
  const unreadCount =
    userData?.[1].filter((notification) => notification.readAt === null).length ??
    0;
  const contentClassName = "pb-20 lg:ml-60 lg:pb-0";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] px-4 sm:px-6 lg:pl-[264px] lg:pr-8">
        <BrandLogo className="lg:hidden" />
        <HeaderContext workspace={workspace} active={active} />

        <div className="ml-auto flex items-center gap-1.5">
          {session ? (
            <>
              <Link
                href="/earn/earnings"
                className="hidden rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-[var(--surface-subtle)] sm:flex sm:items-center sm:gap-2"
                aria-label={`Wallet balance ${formatMoney(balance)}`}
              >
                <Wallet20 aria-hidden="true" />
                {formatMoney(balance)}
              </Link>
              <Link
                href="/notifications"
                className="relative grid size-9 place-items-center rounded-lg hover:bg-[var(--surface-subtle)]"
                aria-label={`${unreadCount} unread notifications`}
              >
                <Bell20 aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[var(--accent)] px-1 text-center text-[10px] leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <ThemeToggle />
              <div className="hidden sm:block">
                <AccountButton name={session.user.name} />
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="solid" color="orange" size="2">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 lg:flex">
        <BrandLogo className="mb-8 ml-2" width={112} />

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-[var(--surface-subtle)] p-1 text-sm font-medium">
          <Link
            href="/earn"
            aria-current={workspace === "earn" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-center ${
              workspace === "earn"
                ? "bg-[var(--surface)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Earn
          </Link>
          <Link
            href="/business"
            aria-current={workspace === "business" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-center ${
              workspace === "business"
                ? "bg-[var(--surface)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Business
          </Link>
        </div>

        <nav aria-label="Primary" className="space-y-1">
          <NavigationItems
            active={active}
            workspace={workspace}
            unreadCount={unreadCount}
          />
        </nav>

        <div className="mt-auto rounded-xl bg-[var(--surface-subtle)] p-3 text-xs leading-4 text-[var(--muted)]">
          Campaign budgets stay reserved until submitted work is approved.
        </div>
      </aside>

      {childHasMain ? (
        <div className={contentClassName}>
          <PageTransition>{children}</PageTransition>
        </div>
      ) : (
        <main className={contentClassName}>
          <PageTransition>{children}</PageTransition>
        </main>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <NavigationItems
          active={active}
          workspace={workspace}
          unreadCount={unreadCount}
          mobile
        />
      </nav>
    </div>
  );
}
