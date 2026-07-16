import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required");
}

export const auth = betterAuth({
  appName: "Whop Tasks",
  secret,
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
    usePlural: true,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  trustedOrigins: [baseURL],
});

export type AuthSession = typeof auth.$Infer.Session;
