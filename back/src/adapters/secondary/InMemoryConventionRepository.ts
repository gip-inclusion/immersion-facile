import { ConventionRepository } from "../../domain/convention/ports/ConventionRepository";
import { createLogger } from "../../utils/logger";
import {
  ConventionDto,
  ConventionId,
} from "shared/src/convention/convention.dto";

const logger = createLogger(__filename);

export class InMemoryConventionRepository implements ConventionRepository {
  public _conventions: Record<string, ConventionDto> = {};

  public async save(
    convention: ConventionDto,
  ): Promise<ConventionId | undefined> {
    logger.info({ convention }, "save");
    if (this._conventions[convention.id]) {
      return undefined;
    }
    this._conventions[convention.id] = convention;
    return convention.id;
  }

  public async getById(id: ConventionId) {
    logger.info({ id }, "getById");
    return this._conventions[id];
  }

  public async update(convention: ConventionDto) {
    logger.info({ convention }, "updateConvention");
    const id = convention.id;
    if (!this._conventions[id]) return;

    this._conventions[id] = convention;
    return id;
  }

  // for test purpose

  setConventions(conventions: Record<string, ConventionDto>) {
    this._conventions = conventions;
  }
}
