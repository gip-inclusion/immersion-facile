import {
  ApiConsumerName,
  EstablishmentSearchableByValue,
  Flavor,
  SearchSortedBy,
  WithAcquisition,
} from "shared";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  appellationCodes?: string[];
  romeCode?: string;
  distanceKm: number;
  lat: number;
  lon: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
} & WithAcquisition;

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
  numberOfResults: number;
} & SearchMade;
