import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  className = "",
  brandmarkSize = 32,
  width,
}: {
  className?: string;
  brandmarkSize?: number;
  /** Scales the brandmark when provided by older call sites. */
  width?: number;
}) {
  const iconSize = width ? Math.round((width * 32) / 108) : brandmarkSize;

  return (
    <Link
      href="/"
      className={`inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg ${className}`}
      aria-label="Whop Tasks marketplace"
    >
      <Image
        src="/brand/logos/whop_brandmark_orange.svg"
        alt=""
        width={iconSize}
        height={iconSize}
        priority
        aria-hidden
      />
      <span className="inline-flex items-baseline gap-1 text-[20px] leading-[23px] font-medium tracking-normal">
        <span className="text-[var(--accent)]">Whop</span>
        <span className="text-[var(--foreground)]">Tasks</span>
      </span>
    </Link>
  );
}
