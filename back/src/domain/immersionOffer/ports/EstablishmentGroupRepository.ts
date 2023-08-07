import {
  EstablishmentGroupSlug,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";

export interface EstablishmentGroupRepository {
  groupsWithSiret(siret: SiretDto): Promise<EstablishmentGroupEntity[]>;
  findSearchImmersionResultsBySlug(
    slug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]>;

  save(group: EstablishmentGroupEntity): Promise<void>;
}
