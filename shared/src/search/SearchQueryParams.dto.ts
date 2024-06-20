import { WithAcquisition } from "../acquisition.dto";
import { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const searchSortedByOptions = ["distance", "date", "score"] as const;
export type SearchSortedBy = (typeof searchSortedByOptions)[number];

export type GeoQueryParamsWithSortedBy<T extends SearchSortedBy> = {
  longitude: number;
  latitude: number;
  distanceKm: number;
  sortedBy: T;
};

export type GeoQueryOptionalParamsWithSortedBy<T extends SearchSortedBy> = {
  longitude?: number;
  latitude?: number;
  distanceKm?: number;
  sortedBy: T;
};

type SearchQueryCommonParamsDto = {
  appellationCodes?: AppellationCode[];
  rome?: RomeCode;
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
} & WithAcquisition;

export type SearchQueryWithOptionalGeoParamsDto = SearchQueryCommonParamsDto &
  GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type SearchQueryParamsWithGeoParams = SearchQueryCommonParamsDto &
  GeoQueryParamsWithSortedBy<"distance">;

export type SearchQueryParamsDto =
  | SearchQueryWithOptionalGeoParamsDto
  | SearchQueryParamsWithGeoParams;
