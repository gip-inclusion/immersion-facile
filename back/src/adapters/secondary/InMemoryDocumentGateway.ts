import { StoredFile } from "../../domain/generic/fileManagement/entity/StoredFile";
import { DocumentGateway } from "../../domain/generic/fileManagement/port/DocumentGateway";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryDocumentGateway implements DocumentGateway {
  // Not used for now... probably never will be but needed for compilation
  async put(_file: StoredFile): Promise<void> {
    logger.warn("Not implemented");
  }

  getFileUrl(name: string): string {
    logger.warn("Not implemented");
    return name;
  }
}
