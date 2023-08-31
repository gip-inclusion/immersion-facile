import { ApiConsumerName, Flavor, SearchSortedBy } from "shared";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  appellationCode?: string;
  distanceKm: number;
  lat: number;
  lon: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
};

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
} & SearchMade;
