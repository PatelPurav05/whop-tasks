import { del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import type { PrivateStorage, StoredObject } from "./private-storage";

export class BlobPrivateStorage implements PrivateStorage {
  async write(input: {
    data: Uint8Array;
    extension: string;
  }): Promise<StoredObject> {
    const pathname = `proofs/${randomUUID()}${input.extension}`;
    const blob = await put(pathname, input.data, {
      access: "private",
      addRandomSuffix: false,
    });

    return {
      key: blob.url,
      sizeBytes: input.data.byteLength,
    };
  }

  async read(key: string): Promise<Buffer> {
    const result = await get(key, { access: "private" });
    if (result.statusCode !== 200 || !result.stream) {
      throw new Error("Private proof file was not found in blob storage");
    }

    const bytes = await new Response(result.stream).arrayBuffer();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await del(key);
  }
}

export const blobPrivateStorage = new BlobPrivateStorage();
