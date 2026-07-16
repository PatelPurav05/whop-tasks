import { timingSafeEqual } from "node:crypto";
import { runDemoSeed } from "@/scripts/seed-demo";

export const runtime = "nodejs";

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request): Promise<Response> {
  const setupSecret = process.env.DEMO_SETUP_SECRET;
  if (!setupSecret) {
    return Response.json(
      { error: "Demo setup is not configured for this deployment" },
      { status: 404 },
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token || !secretsMatch(token, setupSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    process.env.DEMO_SEED_ALLOWED = "true";
    await runDemoSeed();
    return Response.json({
      ok: true,
      message: "Demo data seeded successfully",
      accounts: [
        "maya@whoptasks.local / WhopTasksDemo!2026",
        "jordan@whoptasks.local / WhopTasksDemo!2026",
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Demo setup failed unexpectedly";
    return Response.json({ error: message }, { status: 500 });
  }
}
