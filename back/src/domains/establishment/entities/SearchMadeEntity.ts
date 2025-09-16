import type {
  ApiConsumerName,
  EstablishmentSearchableByValue,
  Flavor,
  SearchSortedBy,
  WithAcquisition,
  WithNafCodes,
} from "shared";
import { hasSearchGeoParams } from "../use-cases/LegacySearchImmersion";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

type SearchMadeWithoutGeoParams = {
  appellationCodes?: string[];
  romeCode?: string;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
} & WithAcquisition &
  WithNafCodes;

type SearchMadeWithGeoParams = GeoParams & SearchMadeWithoutGeoParams;

export type SearchMade = SearchMadeWithGeoParams | SearchMadeWithoutGeoParams;

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
  numberOfResults: number;
} & SearchMade;

export type GeoParams = {
  lat: number;
  lon: number;
  distanceKm: number;
};

export const hasSearchMadeGeoParams = (
  searchMade: SearchMade,
): searchMade is SearchMadeWithGeoParams => {
  const searchMadeWithGeoParams = searchMade as SearchMadeWithGeoParams;
  return hasSearchGeoParams(searchMadeWithGeoParams);
};
