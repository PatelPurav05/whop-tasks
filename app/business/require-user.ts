import "server-only";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/permissions";

export async function requireBusinessUserId(returnTo: string): Promise<string> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return session.user.id;
}
