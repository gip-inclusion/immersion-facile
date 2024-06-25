import { WithAcquisition } from "../acquisition.dto";
import { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { OneKeyNeedsAnother } from "../utils";

export const searchSortedByOptions = ["distance", "date", "score"] as const;
export type SearchSortedBy = (typeof searchSortedByOptions)[number];

type LatLon = {
  latitude: number;
  longitude: number;
};

type LatLonDistance = LatLon & {
  distanceKm: number;
};

export type GeoQueryParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & LatLonDistance;

export type GeoQueryOptionalParamsWithSortedBy<T extends SearchSortedBy> = {
  sortedBy: T;
} & OneKeyNeedsAnother<Partial<LatLonDistance>, "latitude", "longitude">;

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
