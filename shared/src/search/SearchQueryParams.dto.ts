import { WithAcquisition } from "../acquisition.dto";
import { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const searchSortedByOptions = ["distance", "date", "score"] as const;
export type SearchSortedBy = (typeof searchSortedByOptions)[number];

type LatLon = {
  latitude: number;
  longitude: number;
};

export type LatLonDistance = LatLon & {
  distanceKm: number;
};

export type GeoQueryParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & LatLonDistance;

export type GeoQueryOptionalParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & Partial<LatLonDistance>;

type SearchQueryCommonParamsDto = {
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
  fitForDisabledWorkers?: boolean;
} & WithAcquisition;

type SearchQueryParamsAppellationsAndRome = {
  appellationCodes?: AppellationCode[];
  rome?: RomeCode;
};

export type SearchQueryWithOptionalGeoParamsDto = SearchQueryCommonParamsDto &
  GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type SearchQueryParamsWithGeoParams = SearchQueryCommonParamsDto &
  GeoQueryParamsWithSortedBy<"distance">;

export type SearchQueryBaseWithoutAppellationsAndRomeDto =
  | SearchQueryParamsWithGeoParams
  | SearchQueryWithOptionalGeoParamsDto;

export type SearchQueryParamsDto =
  SearchQueryBaseWithoutAppellationsAndRomeDto &
    SearchQueryParamsAppellationsAndRome;
