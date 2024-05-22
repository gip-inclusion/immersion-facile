import { FormEstablishmentDto, SiretDto, propEq } from "shared";
import {
  ConflictError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import {
  FormEstablishmentRepository,
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
} from "../ports/FormEstablishmentRepository";

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  #formEstablishments: FormEstablishmentDto[] = [];

  public async create(dto: FormEstablishmentDto): Promise<void> {
    if (await this.getBySiret(dto.siret)) {
      const message = `Immersion DTO with siret ${dto.siret} is already in the list`;
      throw new ConflictError(message);
    }

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
