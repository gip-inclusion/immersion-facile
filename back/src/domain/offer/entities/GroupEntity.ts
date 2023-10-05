import { GroupName, GroupSlug, SiretDto } from "shared";

export type GroupEntity = {
  slug: GroupSlug;
  name: GroupName;
  sirets: SiretDto[];
};
