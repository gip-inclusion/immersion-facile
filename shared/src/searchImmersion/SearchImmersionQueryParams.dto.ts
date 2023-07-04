import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type SearchSortedBy = "distance" | "date";
export type SearchImmersionQueryParamsDto = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCode?: AppellationCode;
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
};
