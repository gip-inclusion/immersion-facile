import {
  AppellationCode,
  RomeCode,
  SearchImmersionQueryParamsDto,
} from "shared";

type SearchSortedBy = "distance" | "date";

export type SearchImmersionRequestPublicV1 = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCode?: AppellationCode;
  distance_km: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
};

export const searchImmersionRequestPublicV1ToDomain = (
  publicV1: SearchImmersionRequestPublicV1,
): SearchImmersionQueryParamsDto => {
  const { distance_km, ...rest } = publicV1;
  return {
    ...rest,
    distanceKm: distance_km,
  };
};
