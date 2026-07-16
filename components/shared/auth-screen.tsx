import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "./auth-form";

export function AuthScreen({
  mode,
  callbackPath,
}: {
  mode: "sign-in" | "sign-up";
  callbackPath: string;
}) {
  const isSignUp = mode === "sign-up";

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
      <section className="flex min-h-screen flex-col bg-[var(--surface)] px-6 py-6 sm:px-10 lg:px-14">
        <Link href="/" aria-label="Return to marketplace" className="w-fit">
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

        <div className="my-auto w-full max-w-md py-12">
          <p className="text-sm font-medium text-[var(--accent)]">
            {isSignUp ? "Start earning" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-[32px] leading-[35px] font-medium">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </h1>
          <p className="mt-3 max-w-[65ch] text-[var(--muted)]">
            {isSignUp
              ? "One account gives you both Earn and Business workspaces."
              : "Return to your claims, proof requests, and demo earnings."}
          </p>
          <AuthForm mode={mode} callbackPath={callbackPath} />
        </div>

        <p className="text-xs text-[var(--muted)]">
          Demo balances have no cash value.
        </p>
      </section>

      <aside className="relative hidden overflow-hidden bg-[var(--brand-charcoal)] p-12 text-[var(--brand-off-white)] lg:flex lg:flex-col lg:justify-end">
        <div className="absolute left-12 top-12 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/20 px-4 py-3">
            <span className="block text-white/60">01</span>
            <span className="mt-1 block font-medium">Claim a funded slot</span>
          </div>
          <div className="rounded-xl border border-white/20 px-4 py-3">
            <span className="block text-white/60">02</span>
            <span className="mt-1 block font-medium">Submit clear proof</span>
          </div>
          <div className="rounded-xl border border-white/20 px-4 py-3">
            <span className="block text-white/60">03</span>
            <span className="mt-1 block font-medium">Respond to feedback</span>
          </div>
          <div className="rounded-xl border border-white/20 px-4 py-3">
            <span className="block text-white/60">04</span>
            <span className="mt-1 block font-medium">Get paid on approval</span>
          </div>
        </div>
        <p className="max-w-lg text-[32px] leading-[35px] font-medium">
          Clear requirements, visible capacity, and a payout trail you can
          follow.
        </p>
        <p className="mt-4 max-w-md text-white/65">
          Whop Tasks keeps every step of the transaction legible from claim to
          simulated payout.
        </p>
      </aside>
    </main>
  );
}
