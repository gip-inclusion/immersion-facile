import type { WithAcquisition } from "../acquisition.dto";
import type { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import type { WithNafCodes } from "../naf/naf.dto";
import type {
  PaginationQueryParams,
  WithSort,
} from "../pagination/pagination.dto";
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

export type GeoQueryOptionalParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & Partial<LatLonDistance>;

type GetOffersCommonParamsDto = {
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
  fitForDisabledWorkers?: boolean | undefined;
};

export type SearchQueryWithOptionalGeoParamsDto = GetOffersCommonParamsDto &
  GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type SearchQueryParamsWithGeoParams = GetOffersCommonParamsDto &
  LegacyGeoQueryParamsWithSortedBy<"distance">;

export type SearchQueryParamsWithGeoParamsDto = GetOffersCommonParamsDto &
  LatLonDistance &
  PaginationQueryParams &
  WithSort<"distance">;
export type SearchQueryParamsWithoutGeoParamsDto = GetOffersCommonParamsDto &
  Partial<LatLonDistance> &
  PaginationQueryParams &
  WithSort<"score" | "date">;
export type SearchQueryParamsDto =
  | SearchQueryParamsWithGeoParamsDto
  | SearchQueryParamsWithoutGeoParamsDto;

export type LegacyGeoQueryParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & LatLonDistance;

type LegacySearchQueryCommonParamsDto = {
  voluntaryToImmersion?: boolean;
} & GetOffersCommonParamsDto &
  WithAcquisition &
  WithNafCodes;

type SearchQueryParamsAppellationsAndRome = {
  appellationCodes?: AppellationCode[];
  rome?: RomeCode;
};

export type LegacySearchQueryWithOptionalGeoParamsDto =
  LegacySearchQueryCommonParamsDto &
    GeoQueryOptionalParamsWithSortedBy<"date" | "score">;

export type LegacySearchQueryParamsWithGeoParams =
  LegacySearchQueryCommonParamsDto &
    LegacyGeoQueryParamsWithSortedBy<"distance">;

export type LegacySearchQueryBaseWithoutAppellationsAndRomeDto =
  | LegacySearchQueryParamsWithGeoParams
  | LegacySearchQueryWithOptionalGeoParamsDto;

export type LegacySearchQueryParamsDto =
  LegacySearchQueryBaseWithoutAppellationsAndRomeDto &
    SearchQueryParamsAppellationsAndRome;
