import { prop } from "ramda";
import { SiretDto } from "shared";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../domain/immersionOffer/ports/DeletedEstablishmentRepository";

export class InMemoryDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #deletedEstablishments: DeletedEstablishementDto[] = [];

  public async isSiretsDeleted(siretsToCheck: SiretDto[]): Promise<SiretDto[]> {
    return siretsToCheck.filter((siret) =>
      this.#deletedEstablishments.map(prop("siret")).includes(siret),
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
