import { values } from "ramda";
import { ConventionDto, ConventionId, Email } from "shared";
import { ConflictError } from "../../../config/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { ConventionRepository } from "../ports/ConventionRepository";

const logger = createLogger(__filename);

export class InMemoryConventionRepository implements ConventionRepository {
  #conventions: Record<string, ConventionDto> = {};

  public get conventions() {
    return Object.values(this.#conventions);
  }

  public async deprecateConventionsWithoutDefinitiveStatusEndedSince(): Promise<number> {
    throw new Error("not implemented");
  }

  public async getById(id: ConventionId) {
    logger.info({ id }, "getById");
    return this.#conventions[id];
  }

  public async getIdsByEstablishmentRepresentativeEmail(
    email: Email,
  ): Promise<ConventionId[]> {
    return values(this.#conventions)
      .filter(
        ({ signatories }) =>
          signatories.establishmentRepresentative.email === email,
      )
      .map(({ id }) => id);
  }

  public async getIdsByEstablishmentTutorEmail(
    email: Email,
  ): Promise<ConventionId[]> {
    return values(this.#conventions)
      .filter(({ establishmentTutor }) => establishmentTutor.email === email)
      .map(({ id }) => id);
  }

  public async save(convention: ConventionDto): Promise<void> {
    logger.info({ conventionWithoutExternalId: convention }, "save");
    if (this.#conventions[convention.id]) {
      throw new ConflictError(
        `Convention with id ${convention.id} already exists`,
      );
    }
    this.#conventions[convention.id] = convention;
  }

  // for test purpose
  public setConventions(conventions: ConventionDto[]) {
    this.#conventions = conventions.reduce<Record<ConventionId, ConventionDto>>(
      (acc, convention) => ({ ...acc, [convention.id]: convention }),
      {},
    );
  }

  public async update(convention: ConventionDto) {
    logger.info({ convention }, "updateConvention");
    const id = convention.id;
    if (!this.#conventions[id]) return;

    this.#conventions[id] = convention;
    return id;
  }
}
