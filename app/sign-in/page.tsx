import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/shared/auth-screen";
import { getCurrentSession } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Sign in",
};

function getSafeCallbackPath(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/earn";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [session, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);
  const callbackPath = getSafeCallbackPath(params.callbackUrl);

  if (session) {
    redirect(callbackPath);
  }

  return <AuthScreen mode="sign-in" callbackPath={callbackPath} />;
}
