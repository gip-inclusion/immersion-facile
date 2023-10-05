import { GroupSlug, SearchResultDto, SiretDto } from "shared";
import { GroupEntity } from "../entities/GroupEntity";

export interface GroupRepository {
  groupsWithSiret(siret: SiretDto): Promise<GroupEntity[]>;
  findSearchResultsBySlug(slug: GroupSlug): Promise<SearchResultDto[]>;
  save(group: GroupEntity): Promise<void>;
}
