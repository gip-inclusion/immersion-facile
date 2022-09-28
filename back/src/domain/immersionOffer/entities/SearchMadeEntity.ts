import { Flavor } from "shared";
import { ApiConsumerName } from "../../core/valueObjects/ApiConsumer";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  rome?: string;
  distance_km: number;
  lat: number;
  lon: number;
  sortedBy: "distance" | "date";
  voluntaryToImmersion?: boolean;
};

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
} & SearchMade;
