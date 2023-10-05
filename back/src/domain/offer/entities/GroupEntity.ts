import { GroupName, GroupOptions, GroupSlug, SiretDto } from "shared";

export type GroupEntity = {
  slug: GroupSlug;
  name: GroupName;
  options: GroupOptions;
  sirets: SiretDto[];
};
