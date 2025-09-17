import type { WithAcquisition } from "../acquisition.dto";
import type { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import type { WithNafCodes } from "../naf/naf.dto";
import type { PaginationQueryParams, WithSort } from "../pagination/pagination.dto";
import type {
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

type GetOffersCommonParamsDto = {
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
  fitForDisabledWorkers?: boolean | undefined;
};

type LegacySearchQueryCommonParamsDto = {
  voluntaryToImmersion?: boolean;
} & GetOffersCommonParamsDto &
  WithAcquisition &
  WithNafCodes;

type SearchQueryParamsAppellationsAndRome = {
  appellationCodes?: AppellationCode[];
  rome?: RomeCode;
};

export type LegacySearchQueryWithOptionalGeoParamsDto = LegacySearchQueryCommonParamsDto &
  GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type LegacySearchQueryParamsWithGeoParams = LegacySearchQueryCommonParamsDto &
  GeoQueryParamsWithSortedBy<"distance">;

export type LegacySearchQueryBaseWithoutAppellationsAndRomeDto =
  | LegacySearchQueryParamsWithGeoParams
  | LegacySearchQueryWithOptionalGeoParamsDto;

export type LegacySearchQueryParamsDto =
  LegacySearchQueryBaseWithoutAppellationsAndRomeDto &
  SearchQueryParamsAppellationsAndRome;


export type SearchQueryWithOptionalGeoParamsDto = GetOffersCommonParamsDto &
  GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type SearchQueryParamsWithGeoParams = GetOffersCommonParamsDto &
  GeoQueryParamsWithSortedBy<"distance">;

export type SearchQueryBaseWithoutAppellationsAndRomeDto =
  | SearchQueryParamsWithGeoParams
  | SearchQueryWithOptionalGeoParamsDto;

export type SearchQueryParamsDto = SearchQueryBaseWithoutAppellationsAndRomeDto &
  PaginationQueryParams;

const params: SearchQueryParamsDto = {
  place: "Paris",
  establishmentSearchableBy: "students",
  fitForDisabledWorkers: true,
  sort: { by: "distance", order: "asc" },
  distanceKm: 10,
  latitude: 48.8566,
  longitude: 2.3522,
};

type TestParamsWithoutDistance = WithSort<"score" | "date"> & Partial<LatLonDistance>


type TestParams2 = (WithSort<"distance"> & LatLonDistance) | TestParamsWithoutDistance


const params2: TestParams2 = {
  sort: { by: "distance", order: "asc" },
  distanceKm: 10,
  latitude: 48.8566,
  longitude: 2.3522,
};

console.log(params2);