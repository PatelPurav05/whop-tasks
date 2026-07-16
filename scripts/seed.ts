import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

async function main(): Promise<void> {
  const [{ pool }, { runDemoSeed }] = await Promise.all([
    import("@/db"),
    import("./seed-demo"),
  ]);

  try {
    await runDemoSeed();
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Demo seed failed:", error);
  process.exitCode = 1;
});
