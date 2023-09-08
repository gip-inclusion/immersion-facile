import {
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
} from "shared";
import { ConventionRepository } from "../../domain/convention/ports/ConventionRepository";
import { createLogger } from "../../utils/logger";
import { ConflictError } from "../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class InMemoryConventionRepository implements ConventionRepository {
  public _conventions: Record<string, ConventionDto> = {};

  #nextExternalId: ConventionExternalId = "00000000001";

  public get conventions() {
    return Object.values(this._conventions);
  }

  public async getById(id: ConventionId) {
    logger.info({ id }, "getById");
    return this._conventions[id];
  }

  public async save(
    conventionWithoutExternalId: ConventionDtoWithoutExternalId,
  ): Promise<ConventionExternalId> {
    logger.info({ conventionWithoutExternalId }, "save");
    const convention: ConventionDto = {
      ...conventionWithoutExternalId,
      externalId: this.#nextExternalId,
    };
    if (this._conventions[convention.id]) {
      throw new ConflictError(
        `Convention with id ${convention.id} already exists`,
      );
    }
    this._conventions[convention.id] = convention;
    return convention.externalId;
  }

  // for test purpose
  public setConventions(conventions: Record<string, ConventionDto>) {
    this._conventions = conventions;
  }

  public setNextExternalId(externalId: ConventionExternalId) {
    this.#nextExternalId = externalId;
  }

  public async update(convention: ConventionDto) {
    logger.info({ convention }, "updateConvention");
    const id = convention.id;
    if (!this._conventions[id]) return;

    this._conventions[id] = convention;
    return id;
  }
}
