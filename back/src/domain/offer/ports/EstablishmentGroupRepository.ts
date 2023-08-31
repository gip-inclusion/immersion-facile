import { EstablishmentGroupSlug, SearchResultDto, SiretDto } from "shared";
import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";

export interface EstablishmentGroupRepository {
  groupsWithSiret(siret: SiretDto): Promise<EstablishmentGroupEntity[]>;
  findSearchImmersionResultsBySlug(
    slug: EstablishmentGroupSlug,
  ): Promise<SearchResultDto[]>;

  save(group: EstablishmentGroupEntity): Promise<void>;
}
