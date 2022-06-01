import { ConventionEntity } from "../../domain/convention/entities/ConventionEntity";
import { ConventionRepository } from "../../domain/convention/ports/ConventionRepository";
import { createLogger } from "../../utils/logger";
import { ConventionId } from "shared/src/convention/convention.dto";

const logger = createLogger(__filename);

export class InMemoryConventionRepository implements ConventionRepository {
  public _conventions: Record<string, ConventionEntity> = {};

  public async save(
    convention: ConventionEntity,
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

  public async update(convention: ConventionEntity) {
    logger.info({ convention }, "updateConvention");
    const id = convention.id;
    if (!this._conventions[id]) return;

    this._conventions[id] = convention;
    return id;
  }

  // for test purpose

  setConventions(conventions: Record<string, ConventionEntity>) {
    this._conventions = conventions;
  }
}
