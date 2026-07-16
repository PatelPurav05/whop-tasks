import {
  Bell20,
  Clipboard20,
  Home20,
  MagnifyingGlass16,
  Wallet20,
} from "@frosted-ui/icons";
import { Button, TextField } from "@whop/react/components";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/lib/permissions";
import { getUserBalance } from "@/lib/services/ledger";
import { listNotifications } from "@/lib/services/notifications";
import { formatMoney } from "./format";
import { AccountButton } from "./account-button";
import { ThemeToggle } from "./theme-toggle";

type ActiveArea =
  | "business"
  | "business-create"
  | "business-wallet"
  | "earn"
  | "earnings"
  | "marketplace"
  | "notifications";

const earnNavigation = [
  { href: "/", label: "Marketplace", area: "marketplace", icon: Home20 },
  { href: "/earn", label: "My tasks", area: "earn", icon: Clipboard20 },
  { href: "/earn/earnings", label: "Earnings", area: "earnings", icon: Wallet20 },
  {
    href: "/notifications",
    label: "Notifications",
    area: "notifications",
    icon: Bell20,
  },
] satisfies Array<{
  href: string;
  label: string;
  area: ActiveArea;
  icon: typeof Home20;
}>;

const businessNavigation = [
  { href: "/business", label: "Campaigns", area: "business", icon: Home20 },
  {
    href: "/business/campaigns/new",
    label: "Create",
    area: "business-create",
    icon: Clipboard20,
  },
  {
    href: "/business/wallet",
    label: "Wallet",
    area: "business-wallet",
    icon: Wallet20,
  },
  {
    href: "/notifications",
    label: "Notifications",
    area: "notifications",
    icon: Bell20,
  },
] satisfies Array<{
  href: string;
  label: string;
  area: ActiveArea;
  icon: typeof Home20;
}>;

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
  const navigation =
    workspace === "business" ? businessNavigation : earnNavigation;
  const contentClassName = "pb-20 lg:ml-60 lg:pb-0";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 lg:pl-[264px] lg:pr-8">
        <Link
          href="/"
          className="shrink-0 lg:hidden"
          aria-label="Whop Tasks marketplace"
        >
          <Image
            src="/brand/logos/whop_logo_lockup_duo_black.svg"
            alt="Whop"
            width={94}
            height={21}
            priority
            className="dark:hidden"
          />
          <Image
            src="/brand/logos/whop_logo_lockup_duo_white.svg"
            alt="Whop"
            width={94}
            height={21}
            priority
            className="hidden dark:block"
          />
        </Link>

        <form action="/" className="hidden min-w-0 max-w-lg flex-1 sm:block">
          <TextField.Root size="2">
            <TextField.Slot>
              <MagnifyingGlass16 aria-hidden="true" />
            </TextField.Slot>
            <TextField.Input
              type="search"
              name="q"
              aria-label="Search marketplace"
              placeholder="Search tasks"
            />
          </TextField.Root>
        </form>

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
        <Link href="/" className="mb-8 px-2" aria-label="Whop Tasks marketplace">
          <Image
            src="/brand/logos/whop_logo_lockup_duo_black.svg"
            alt="Whop"
            width={112}
            height={25}
            priority
            className="dark:hidden"
          />
          <Image
            src="/brand/logos/whop_logo_lockup_duo_white.svg"
            alt="Whop"
            width={112}
            height={25}
            priority
            className="hidden dark:block"
          />
        </Link>

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
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = active === item.area;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                  selected
                    ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {item.area === "notifications" && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-[var(--accent)] px-1.5 text-[11px] leading-5 text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl bg-[var(--surface-subtle)] p-3 text-xs leading-4 text-[var(--muted)]">
          Demo money only. Tasks and payouts stay local to this interview build.
        </div>
      </aside>

      {childHasMain ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        <main className={contentClassName}>{children}</main>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.area;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] ${
                selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon aria-hidden="true" />
              <span>
                {item.label === "Marketplace" ? "Browse" : item.label}
              </span>
              {item.area === "notifications" && unreadCount > 0 ? (
                <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-[var(--accent)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
