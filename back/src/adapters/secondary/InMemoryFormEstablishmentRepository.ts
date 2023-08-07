import { FormEstablishmentDto, propEq, SiretDto } from "shared";
import {
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
  FormEstablishmentRepository,
} from "../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { createLogger } from "../../utils/logger";
import { ConflictError, NotFoundError } from "../primary/helpers/httpErrors";

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
    const formEstablishmentIndex = this.#formEstablishments.findIndex(
      (formEstablishment) => formEstablishment.siret === siret,
    );
    if (formEstablishmentIndex === -1)
      throw new NotFoundError(formEstablishmentNotFoundErrorMessage(siret));
    this.#formEstablishments.splice(formEstablishmentIndex, 1);
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
    let updated = false;
    this.#formEstablishments = this.#formEstablishments.map((repoDto) => {
      if (repoDto.siret === dto.siret) {
        updated = true;
        return dto;
      }
      return repoDto;
    });

    if (!updated)
      throw new ConflictError(formEstablishementUpdateFailedErrorMessage(dto));
  }
}
