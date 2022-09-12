import { StoredFile } from "../entity/StoredFile";

export interface DocumentGateway {
  put(document: StoredFile): Promise<void>;
  getFileUrl(name: StoredFile): string;
}
