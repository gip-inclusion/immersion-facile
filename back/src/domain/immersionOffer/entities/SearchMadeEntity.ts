import { Flavor } from "../../../shared/typeFlavors";
import { ApiConsumerName } from "../../core/valueObjects/ApiConsumer";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  rome?: string;
  distance_km: number;
  lat: number;
  lon: number;
  voluntary_to_immersion?: boolean;
};

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
} & SearchMade;
