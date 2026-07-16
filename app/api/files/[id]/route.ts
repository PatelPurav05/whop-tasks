import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { campaigns, files, submissions } from "@/db/schema";
import { getCurrentSession } from "@/lib/permissions";
import { privateStorage } from "@/lib/storage/local-private-storage";

const fileIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const parsedId = fileIdSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return Response.json({ error: "File was not found" }, { status: 404 });
  }

  const [record] = await db
    .select({
      file: files,
      campaignOwnerId: campaigns.ownerId,
    })
    .from(files)
    .leftJoin(submissions, eq(submissions.id, files.submissionId))
    .leftJoin(campaigns, eq(campaigns.id, submissions.campaignId))
    .where(eq(files.id, parsedId.data))
    .limit(1);

  if (!record) {
    return Response.json({ error: "File was not found" }, { status: 404 });
  }

  const canRead =
    record.file.ownerId === session.user.id ||
    record.campaignOwnerId === session.user.id;
  if (!canRead) {
    return Response.json(
      { error: "You do not have access to this file" },
      { status: 403 },
    );
  }

  const body = await privateStorage.read(record.file.storageKey);
  const responseBody = new Uint8Array(body.byteLength);
  responseBody.set(body);
  const encodedName = encodeURIComponent(record.file.originalName);

  return new Response(responseBody.buffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(record.file.sizeBytes),
      "Content-Type": record.file.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
