import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export class InMemoryEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  // eslint-disable-next-line @typescript-eslint/require-await
  public async save(group: EstablishmentGroupEntity) {
    this.groups.push(group);
  }

  // for test purpose
  public groups: EstablishmentGroupEntity[] = [];
}
