import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { SearchResultDto } from "../search/SearchResult.dto";
import type { Flavor } from "../typeFlavors";

export type GroupName = Flavor<string, "GroupName">;
export type GroupSlug = Flavor<string, "GroupSlug">;
export type WithGroupSlug = {
  groupSlug: GroupSlug;
};

type GroupHeroHeader = {
  title: string;
  description: string;
  logoUrl?: AbsoluteUrl;
  backgroundColor?: string;
};

export type GroupOptions = {
  heroHeader: GroupHeroHeader;
  tintColor?: string;
};

export type Group = {
  slug: string;
  name: string;
  options: GroupOptions;
};

export type GroupWithResults = {
  group: Group;
  results: SearchResultDto[];
};
