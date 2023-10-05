import { GroupSlug, GroupWithResults, SiretDto } from "shared";
import { GroupEntity } from "../entities/GroupEntity";

export interface GroupRepository {
  groupsWithSiret(siret: SiretDto): Promise<GroupEntity[]>;
  getGroupWithSearchResultsBySlug(
    slug: GroupSlug,
  ): Promise<GroupWithResults | undefined>;
  save(group: GroupEntity): Promise<void>;
}
