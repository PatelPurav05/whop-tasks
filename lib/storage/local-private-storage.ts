import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { PrivateStorage, StoredObject } from "./private-storage";

export class LocalPrivateStorage implements PrivateStorage {
  readonly root: string;

  constructor(root = process.env.PRIVATE_UPLOAD_ROOT ?? ".data/uploads") {
    this.root = resolve(/* turbopackIgnore: true */ process.cwd(), root);
  }

  private resolveKey(key: string): string {
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`)) {
      throw new Error("Invalid private storage key");
    }
    return target;
  }

  async write(input: {
    data: Uint8Array;
    extension: string;
  }): Promise<StoredObject> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const key = `${randomUUID()}${input.extension}`;
    await writeFile(this.resolveKey(key), input.data, {
      flag: "wx",
      mode: 0o600,
    });
    return { key, sizeBytes: input.data.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    return await readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }
}

export const privateStorage = new LocalPrivateStorage();
