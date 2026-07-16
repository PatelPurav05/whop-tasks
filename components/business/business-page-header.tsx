import type { ReactNode } from "react";

export function BusinessPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-black/10 pb-6 dark:border-white/12 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[12px] leading-[15px] font-medium text-[var(--brand-vermilion)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[32px] leading-[35px] font-medium">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-[68ch] text-[15px] leading-[20px] text-current/65">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
