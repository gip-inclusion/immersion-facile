import type { AbsoluteUrl, StoredFileId } from "shared";
import type { StoredFile } from "../entity/StoredFile";

export interface DocumentGateway {
  save(document: StoredFile): Promise<void>;
  getUrl(name: StoredFileId): Promise<AbsoluteUrl | undefined>;
}
