import { Flavor } from "../../../shared/typeFlavors";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  rome: string;
  distance_km: number;
  lat: number;
  lon: number;
  nafDivision?: string;
  siret?: string;
};

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
} & SearchMade;
