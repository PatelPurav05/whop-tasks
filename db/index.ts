import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDatabase = globalThis as unknown as {
  whopTasksPool?: Pool;
};

export const pool =
  globalForDatabase.whopTasksPool ??
  new Pool({
    connectionString: databaseUrl,
    max: process.env.NODE_ENV === "production" ? 20 : 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.whopTasksPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
