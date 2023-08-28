import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type SearchSortedBy = "distance" | "date";
export type SearchQueryParamsDto = {
  longitude: number;
  latitude: number;
  appellationCode?: AppellationCode;
  rome?: RomeCode;
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
};
