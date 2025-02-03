import { AbsoluteUrl, StoredFileId } from "shared";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

export class InMemoryDocumentGateway implements DocumentGateway {
  storedFiles: Partial<Record<StoredFileId, StoredFile>> = {};

  public async getUrl(id: StoredFileId): Promise<AbsoluteUrl | undefined> {
    const existingFile = this.storedFiles[id];
    return existingFile && `https://fakeS3/${existingFile.id}`;
  }

  public async save(file: StoredFile): Promise<void> {
    this.storedFiles[file.id] = file;
  }
}
