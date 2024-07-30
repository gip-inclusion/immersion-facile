import { FormEstablishmentDto, SiretDto, errors, propEq } from "shared";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  #formEstablishments: FormEstablishmentDto[] = [];

  public async create(dto: FormEstablishmentDto): Promise<void> {
    if (await this.getBySiret(dto.siret))
      throw errors.establishment.conflictError({ siret: dto.siret });

    this.#formEstablishments.push(dto);
  }

  public async delete(siret: SiretDto): Promise<void> {
    const formEstablishmentIndex = this.#formEstablishments.findIndex(
      (formEstablishment) => formEstablishment.siret === siret,
    );
    if (formEstablishmentIndex === -1)
      throw errors.establishment.notFound({ siret });
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
      throw errors.establishment.conflictError({ siret: dto.siret });
  }
}
