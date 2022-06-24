import { ConventionRepository } from "../../domain/convention/ports/ConventionRepository";
import { createLogger } from "../../utils/logger";
import {
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
} from "shared/src/convention/convention.dto";

const logger = createLogger(__filename);

export class InMemoryConventionRepository implements ConventionRepository {
  public _conventions: Record<string, ConventionDto> = {};
  private _nextExternalId: ConventionExternalId = "00000000001";

  public async save(
    conventionWithoutExternalId: ConventionDtoWithoutExternalId,
  ): Promise<ConventionExternalId | undefined> {
    logger.info({ conventionWithoutExternalId }, "save");
    const convention: ConventionDto = {
      ...conventionWithoutExternalId,
      externalId: this._nextExternalId,
    };
    if (this._conventions[convention.id]) {
      return undefined;
    }
    this._conventions[convention.id] = convention;
    return convention.externalId;
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
  setNextExternalId(externalId: ConventionExternalId) {
    this._nextExternalId = externalId;
  }
  get conventions() {
    return Object.values(this._conventions);
  }
}
