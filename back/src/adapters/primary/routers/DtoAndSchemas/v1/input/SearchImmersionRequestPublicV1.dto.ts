import {
  RomeCode,
  SearchImmersionQueryParamsDto,
  SearchSortedBy,
} from "shared";

export type SearchImmersionRequestPublicV1 = {
  rome?: RomeCode;
  siret?: string;
  longitude: number;
  latitude: number;
  distance_km: number;
  sortedBy: SearchSortedBy;
  voluntaryOnly?: boolean;
  address?: string;
};

export const SearchImmersionRequestPublicV1ToDomain = (
  publicV1: SearchImmersionRequestPublicV1,
): SearchImmersionQueryParamsDto => publicV1;
