import type { StoredFileId } from "shared";

export interface StoredFile {
  id: StoredFileId;
  name: string;
  encoding: string;
  size: number;
  buffer: Buffer;
  mimetype: string;
}
