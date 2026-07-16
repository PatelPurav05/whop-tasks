import { headers } from "next/headers";
import { auth, type AuthSession } from "@/lib/auth";

export class AuthenticationError extends Error {
  constructor(message = "Sign in to continue") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireCurrentSession(): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    throw new AuthenticationError();
  }

  return session;
}

export async function requireCurrentUserId(): Promise<string> {
  const session = await requireCurrentSession();
  return session.user.id;
}

export function assertOwner(
  actualOwnerId: string,
  expectedOwnerId: string,
  message = "Only the owner can perform this action",
): void {
  if (actualOwnerId !== expectedOwnerId) {
    throw new AuthorizationError(message);
  }
}

export function assertDifferentUsers(
  firstUserId: string,
  secondUserId: string,
  message: string,
): void {
  if (firstUserId === secondUserId) {
    throw new AuthorizationError(message);
  }
}
