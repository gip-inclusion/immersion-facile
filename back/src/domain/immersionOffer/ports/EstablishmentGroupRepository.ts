import { SearchImmersionResultDto } from "shared";
import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";

export interface EstablishmentGroupRepository {
  save: (group: EstablishmentGroupEntity) => Promise<void>;
  findSearchImmersionResultsBySlug: (
    slug: string,
  ) => Promise<SearchImmersionResultDto[]>;
}
