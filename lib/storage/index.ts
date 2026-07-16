import { blobPrivateStorage } from "./blob-private-storage";
import { LocalPrivateStorage, privateStorage as localPrivateStorage } from "./local-private-storage";
import type { PrivateStorage } from "./private-storage";

function shouldUseBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getPrivateStorage(): PrivateStorage {
  if (shouldUseBlobStorage()) {
    return blobPrivateStorage;
  }

  return localPrivateStorage;
}

export const privateStorage: PrivateStorage = new Proxy({} as PrivateStorage, {
  get(_target, property, receiver) {
    const storage = getPrivateStorage();
    const value = Reflect.get(storage, property, receiver);
    return typeof value === "function" ? value.bind(storage) : value;
  },
});

export { LocalPrivateStorage };
