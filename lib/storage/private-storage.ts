export type StoredObject = {
  key: string;
  sizeBytes: number;
};

export interface PrivateStorage {
  write(input: {
    data: Uint8Array;
    extension: string;
  }): Promise<StoredObject>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
