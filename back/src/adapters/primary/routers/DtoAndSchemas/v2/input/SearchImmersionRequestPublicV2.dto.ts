import {
  AppellationCode,
  RomeCode,
  SearchImmersionQueryParamsDto,
} from "shared";

type SearchSortedBy = "distance" | "date";

export type SearchImmersionRequestPublicV2 = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCode?: AppellationCode;
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
};

export const searchImmersionRequestPublicV2ToDomain = (
  publicV2: SearchImmersionRequestPublicV2,
): SearchImmersionQueryParamsDto => ({
  ...publicV2,
});
