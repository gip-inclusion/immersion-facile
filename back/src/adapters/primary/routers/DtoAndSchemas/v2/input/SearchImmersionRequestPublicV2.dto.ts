import { AppellationCode, RomeCode, SearchQueryParamsDto } from "shared";

type SearchSortedBy = "distance" | "date";

export type SearchImmersionRequestPublicV2 = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCode?: AppellationCode;
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
};

export const searchImmersionRequestPublicV2ToDomain = (
  publicV2: SearchImmersionRequestPublicV2,
): SearchQueryParamsDto => publicV2;
