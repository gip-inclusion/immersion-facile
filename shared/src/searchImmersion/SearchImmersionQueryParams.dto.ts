import { RomeCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type SearchSortedBy = "distance" | "date";
export type SearchImmersionQueryParamsDto = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  distance_km: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  address?: string;
};
