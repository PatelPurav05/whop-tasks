import { AuthForm } from "./auth-form";
import { BrandLogo } from "./brand-logo";

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
        <BrandLogo width={112} />

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
              : "Return to your claims, proof requests, and earnings."}
          </p>
          <AuthForm mode={mode} callbackPath={callbackPath} />
        </div>

        <p className="text-xs text-[var(--muted)]">
          Balances update as campaigns are funded and work is approved.
        </p>
      </section>

      <aside className="relative hidden overflow-hidden bg-[var(--brand-charcoal)] p-12 text-[var(--brand-off-white)] lg:flex lg:flex-col lg:justify-end">
        <ol className="absolute left-12 top-12 w-full max-w-sm border-y border-white/18 text-sm">
          {[
            "Claim a funded slot",
            "Submit clear proof",
            "Respond to feedback",
            "Get paid on approval",
          ].map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-5 border-b border-white/18 py-4 last:border-b-0"
            >
              <span className="w-6 tabular-nums text-white/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{step}</span>
            </li>
          ))}
        </ol>
        <p className="max-w-lg text-[32px] leading-[35px] font-medium">
          Clear requirements, visible capacity, and a payout trail you can
          follow.
        </p>
        <div className="pt-1">
          <p className="max-w-md text-white/65">
            Whop Tasks keeps every step of the transaction legible from claim to
            payout.
          </p>
        </div>
      </aside>
    </main>
  );
}
