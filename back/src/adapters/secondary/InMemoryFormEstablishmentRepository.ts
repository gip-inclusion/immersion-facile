import { FormEstablishmentDto, propEq, SiretDto } from "shared";
import { FormEstablishmentRepository } from "../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { createLogger } from "../../utils/logger";
import { ConflictError } from "../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  #formEstablishments: FormEstablishmentDto[] = [];

  public async create(dto: FormEstablishmentDto): Promise<void> {
    if (await this.getBySiret(dto.siret)) {
      const message = `Immersion DTO with siret ${dto.siret} is already in the list`;
      logger.info({ dto }, message);
      throw new ConflictError(message);
    }
    logger.debug({ immersionOffer: dto }, "Creating a new Immersion Offer");
    this.#formEstablishments.push(dto);
  }

  public async delete(siret: SiretDto): Promise<void> {
    this.#formEstablishments = this.#formEstablishments.filter(
      (formEstablishment) => formEstablishment.siret !== siret,
    );
  }

  public async getAll() {
    return this.#formEstablishments;
  }

  public async getBySiret(
    siretToGet: SiretDto,
  ): Promise<FormEstablishmentDto | undefined> {
    return this.#formEstablishments.find(propEq("siret", siretToGet));
  }

  // for testing purpose
  public setFormEstablishments(formEstablishments: FormEstablishmentDto[]) {
    this.#formEstablishments = formEstablishments;
  }

  public async update(dto: FormEstablishmentDto): Promise<void> {
    if (!(await this.getBySiret(dto.siret))) {
      const message = `Cannot update form establishlment DTO with siret ${dto.siret}, since it is not in list.`;
      logger.info({ dto }, message);
      throw new ConflictError(message);
    }
    this.#formEstablishments = this.#formEstablishments.map((repoDto) =>
      repoDto.siret === dto.siret ? dto : repoDto,
    );
  }
}
