import { createLogger } from "../../../../utils/logger";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

const logger = createLogger(__filename);

export class NotImplementedDocumentGateway implements DocumentGateway {
  // Not used for now... probably never will be but needed for compilation
  public getFileUrl(file: StoredFile): string {
    logger.warn("Not implemented");
    return file.id;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async put(_file: StoredFile): Promise<void> {
    logger.warn("Not implemented");
  }
}
