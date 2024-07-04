import {
  ApiConsumerName,
  EstablishmentSearchableByValue,
  Flavor,
  SearchSortedBy,
  WithAcquisition,
} from "shared";
import { hasSearchGeoParams } from "../use-cases/SearchImmersion";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMadeWithoutGeoParams = {
  appellationCodes?: string[];
  romeCode?: string;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
} & WithAcquisition;

export type SearchMadeWithGeoParams = GeoParams & SearchMadeWithoutGeoParams;

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
