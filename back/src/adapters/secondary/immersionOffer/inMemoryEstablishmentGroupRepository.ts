import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export class InMemoryEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  // eslint-disable-next-line @typescript-eslint/require-await
  public async save(_group: EstablishmentGroupEntity) {
    throw new Error("Not implemented");
  }
}
