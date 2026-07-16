"use client";

import {
  Bell20,
  Clipboard20,
  Home20,
  Wallet20,
} from "@frosted-ui/icons";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ActiveArea =
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

function matchesPath(pathname: string, area: ActiveArea): boolean {
  if (area === "marketplace") {
    return pathname === "/" || pathname.startsWith("/tasks/");
  }
  if (area === "earnings") {
    return pathname.startsWith("/earn/earnings");
  }
  if (area === "earn") {
    return (
      pathname === "/earn" ||
      (pathname.startsWith("/earn/") && !pathname.startsWith("/earn/earnings"))
    );
  }
  if (area === "business-create") {
    return pathname === "/business/campaigns/new";
  }
  if (area === "business-wallet") {
    return pathname.startsWith("/business/wallet");
  }
  if (area === "business") {
    return (
      pathname === "/business" ||
      (pathname.startsWith("/business/") &&
        pathname !== "/business/campaigns/new" &&
        !pathname.startsWith("/business/wallet"))
    );
  }
  return pathname.startsWith("/notifications");
}

export function getActiveNavigationLabel(
  pathname: string | null,
  workspace: "business" | "earn",
  fallback: ActiveArea,
): string {
  const navigation =
    workspace === "business" ? businessNavigation : earnNavigation;

  if (pathname) {
    const match = navigation.find((item) => matchesPath(pathname, item.area));
    if (match) {
      return match.label;
    }
  }

  return (
    navigation.find((item) => item.area === fallback)?.label ??
    (workspace === "business" ? "Campaigns" : "Marketplace")
  );
}

export function NavigationItems({
  active,
  workspace,
  unreadCount,
  mobile = false,
}: {
  active: ActiveArea;
  workspace: "business" | "earn";
  unreadCount: number;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const navigation =
    workspace === "business" ? businessNavigation : earnNavigation;

  if (mobile) {
    return navigation.map((item) => {
      const Icon = item.icon;
      const selected = pathname ? matchesPath(pathname, item.area) : active === item.area;

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
          <span>{item.label === "Marketplace" ? "Browse" : item.label}</span>
          {item.area === "notifications" && unreadCount > 0 ? (
            <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-[var(--accent)]" />
          ) : null}
        </Link>
      );
    });
  }

  return navigation.map((item) => {
    const Icon = item.icon;
    const selected = pathname ? matchesPath(pathname, item.area) : active === item.area;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={selected ? "page" : undefined}
        className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
          selected
            ? "text-[var(--accent)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
        }`}
      >
        {selected ? (
          <motion.span
            layoutId="desktop-navigation-selection"
            className="absolute inset-0 rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        ) : null}
        <Icon aria-hidden="true" className="relative z-10" />
        <span className="relative z-10">{item.label}</span>
        {item.area === "notifications" && unreadCount > 0 ? (
          <span className="relative z-10 ml-auto rounded-full bg-[var(--accent)] px-1.5 text-[11px] leading-5 text-white">
            {unreadCount}
          </span>
        ) : null}
      </Link>
    );
  });
}
