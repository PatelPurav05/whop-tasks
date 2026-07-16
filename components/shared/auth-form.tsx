"use client";

import { Button, TextField } from "@whop/react/components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({
  mode,
  callbackPath,
}: {
  mode: "sign-in" | "sign-up";
  callbackPath: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const callbacks = {
      onSuccess: () => {
        router.push(callbackPath);
        router.refresh();
      },
      onError: (context: { error: { message?: string } }) => {
        setError(context.error.message ?? "Authentication failed. Try again.");
        setIsPending(false);
      },
    };

    if (isSignUp) {
      await authClient.signUp.email(
        { name: name.trim(), email: email.trim(), password },
        callbacks,
      );
    } else {
      await authClient.signIn.email(
        { email: email.trim(), password, rememberMe: true },
        callbacks,
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {isSignUp ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Name</span>
          <TextField.Input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            size="3"
            placeholder="Your name"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Email</span>
        <TextField.Input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          size="3"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <TextField.Input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
          size="3"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-2.5 text-sm text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="solid"
        color="orange"
        size="3"
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        {isSignUp ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        {isSignUp ? "Already have an account?" : "New to Whop Tasks?"}{" "}
        <Link
          href={`${isSignUp ? "/sign-in" : "/sign-up"}?callbackUrl=${encodeURIComponent(callbackPath)}`}
          className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
        >
          {isSignUp ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
