import { SearchImmersionResultDto } from "shared";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

/* eslint-disable @typescript-eslint/require-await */
export class InMemoryEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  public async save(group: EstablishmentGroupEntity) {
    this.groupsByName[group.name] = group;
  }

  public async findSearchImmersionResultsBySlug(
    slug: string,
  ): Promise<SearchImmersionResultDto[]> {
    throw new Error(`Not implemented - ${slug}`);
  }

  // for test purpose
  private groupsByName: Record<string, EstablishmentGroupEntity> = {};

  public set groups(groups: EstablishmentGroupEntity[]) {
    this.groupsByName = groups.reduce(
      (acc, group) => ({ ...acc, [group.name]: group }),
      {} as Record<string, EstablishmentGroupEntity>,
    );
  }

  public get groups(): EstablishmentGroupEntity[] {
    return Object.values(this.groupsByName);
  }
}

/* eslint-enable @typescript-eslint/require-await */
