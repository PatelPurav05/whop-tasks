import { basename } from "node:path";
import { db } from "@/db";
import { files } from "@/db/schema";
import { privateStorage } from "@/lib/storage";
import { assertDomain } from "./errors";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const allowedFiles = {
  "image/jpeg": {
    extension: ".jpg",
    matches: (data: Uint8Array) =>
      data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (data: Uint8Array) =>
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a,
  },
  "application/pdf": {
    extension: ".pdf",
    matches: (data: Uint8Array) =>
      data.length >= 5 &&
      data[0] === 0x25 &&
      data[1] === 0x50 &&
      data[2] === 0x44 &&
      data[3] === 0x46 &&
      data[4] === 0x2d,
  },
} as const;

type AllowedMimeType = keyof typeof allowedFiles;

function isAllowedMimeType(value: string): value is AllowedMimeType {
  return value in allowedFiles;
}

function sanitizeOriginalName(value: string): string {
  return basename(value)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 180);
}

export async function createPrivateFile(input: {
  ownerId: string;
  originalName: string;
  mimeType: string;
  data: Uint8Array;
}): Promise<typeof files.$inferSelect> {
  assertDomain(
    input.data.byteLength > 0 && input.data.byteLength <= MAX_FILE_BYTES,
    "VALIDATION",
    "Proof files must be between 1 byte and 8 MB",
  );
  assertDomain(
    isAllowedMimeType(input.mimeType),
    "VALIDATION",
    "Only PNG, JPEG, and PDF proof files are accepted",
  );

  const fileType = allowedFiles[input.mimeType];
  assertDomain(
    fileType.matches(input.data),
    "VALIDATION",
    "The file contents do not match the declared file type",
  );

  const originalName = sanitizeOriginalName(input.originalName);
  assertDomain(
    originalName.length > 0,
    "VALIDATION",
    "File name must contain visible characters",
  );

  const stored = await privateStorage.write({
    data: input.data,
    extension: fileType.extension,
  });

  try {
    const [file] = await db
      .insert(files)
      .values({
        ownerId: input.ownerId,
        storageKey: stored.key,
        originalName,
        mimeType: input.mimeType,
        sizeBytes: stored.sizeBytes,
      })
      .returning();

    assertDomain(file, "NOT_FOUND", "File metadata was not created");
    return file;
  } catch (error) {
    await privateStorage.delete(stored.key);
    throw error;
  }
}
