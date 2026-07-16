"use client";

import { usePathname } from "next/navigation";
import {
  getActiveNavigationLabel,
  type ActiveArea,
} from "./navigation-items";

export function HeaderContext({
  workspace,
  active,
}: {
  workspace: "business" | "earn";
  active: ActiveArea;
}) {
  const pathname = usePathname();
  const pageLabel = getActiveNavigationLabel(pathname, workspace, active);

  return (
    <div className="hidden min-w-0 lg:block">
      <p className="text-[12px] leading-[15px] text-[var(--muted)]">
        {workspace === "business" ? "Business" : "Earn"}
      </p>
      <p className="truncate text-[15px] leading-[18px] font-medium">
        {pageLabel}
      </p>
    </div>
  );
}
