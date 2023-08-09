import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../domain/immersionOffer/ports/DeletedEstablishmentRepository";

export class InMemoryDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #deletedEstablishments: DeletedEstablishementDto[] = [];

  public get deletedEstablishments() {
    return this.#deletedEstablishments;
  }

  public async save(
    deletedEstablishment: DeletedEstablishementDto,
  ): Promise<void> {
    this.#deletedEstablishments.push(deletedEstablishment);
  }
}
