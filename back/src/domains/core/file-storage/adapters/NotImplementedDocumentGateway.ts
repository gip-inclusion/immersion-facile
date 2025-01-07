import { createLogger } from "../../../../utils/logger";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

const logger = createLogger(__filename);

export class NotImplementedDocumentGateway implements DocumentGateway {
  // Not used for now... probably never will be but needed for compilation
  public getFileUrl(file: StoredFile): string {
    logger.warn({ message: "Not implemented" });
    return file.id;
  }

  public async put(_file: StoredFile): Promise<void> {
    logger.warn({ message: "Not implemented" });
  }
}
