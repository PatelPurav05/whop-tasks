import Link from "next/link";
import { Button } from "@whop/react/components";
import { Inbox20 } from "@frosted-ui/icons";

export function BusinessEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center border-y border-black/10 px-6 py-12 text-center dark:border-white/12">
      <span className="mb-4 grid size-10 place-items-center rounded-full bg-black/5 text-current/70 dark:bg-white/8">
        <Inbox20 aria-hidden="true" />
      </span>
      <h2 className="text-[20px] leading-[23px] font-medium">{title}</h2>
      <p className="mt-2 max-w-[52ch] text-[15px] leading-[20px] text-current/65">
        {description}
      </p>
      {action ? (
        <Button asChild color="orange" variant="solid" className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
