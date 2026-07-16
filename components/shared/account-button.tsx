"use client";

import { Button } from "@whop/react/components";
import { User20 } from "@frosted-ui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AccountButton({ name }: { name: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut(): Promise<void> {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      color="gray"
      size="2"
      loading={isSigningOut}
      onClick={signOut}
      aria-label={`Sign out ${name}`}
      className="max-w-36"
    >
      <User20 aria-hidden="true" />
      <span className="truncate">{name}</span>
    </Button>
  );
}
