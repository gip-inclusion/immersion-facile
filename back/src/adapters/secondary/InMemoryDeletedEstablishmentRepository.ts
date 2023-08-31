import { SiretDto } from "shared";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../domain/offer/ports/DeletedEstablishmentRepository";

export class InMemoryDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #deletedEstablishments: DeletedEstablishementDto[] = [];

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

  public set deletedEstablishments(
    deletedEstablishments: DeletedEstablishementDto[],
  ) {
    this.#deletedEstablishments = deletedEstablishments;
  }

  public async save(
    deletedEstablishment: DeletedEstablishementDto,
  ): Promise<void> {
    this.#deletedEstablishments.push(deletedEstablishment);
  }
}
