import type { ExtractAddedOrMissingKeys } from "../assertions";

export const searchImmersionFiltersKeys = [
  "fitForDisabledWorkers",
  "searchableBy",
  "romeCodes",
  "geoParams",
  "nafCodes",
  "remoteWorkModes",
  "sirets",
  "appellationCodes",
  "locationIds",
  "showOnlyAvailableOffers",
] as const;

export type SearchImmersionFiltersKey =
  (typeof searchImmersionFiltersKeys)[number];

export type ExtractAddedOrMissingSearchFiltersKeys<
  T extends object,
  I extends SearchImmersionFiltersKey = never,
> = ExtractAddedOrMissingKeys<SearchImmersionFiltersKey, T, I>;
