import { SiretDto } from "shared";
import {
  DeletedEstablishmentDto,
  DeletedEstablishmentRepository,
} from "../ports/DeletedEstablishmentRepository";

export class InMemoryDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #deletedEstablishments: DeletedEstablishmentDto[] = [];

  public async areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>> {
    return siretsToCheck.reduce<Record<SiretDto, boolean>>(
      (acc, siretToCheck) => ({
        ...acc,
        [siretToCheck]: this.#deletedEstablishments.some(
          (deletedEstablishment) => deletedEstablishment.siret === siretToCheck,
        ),
      }),
      {},
    );
  }

  public get deletedEstablishments() {
    return this.#deletedEstablishments;
  }

  public set deletedEstablishments(deletedEstablishments: DeletedEstablishmentDto[]) {
    this.#deletedEstablishments = deletedEstablishments;
  }

  public async save(
    deletedEstablishment: DeletedEstablishmentDto,
  ): Promise<void> {
    this.#deletedEstablishments.push(deletedEstablishment);
  }
}
