import { RomeCode } from "../rome";

export type SearchImmersionQueryParamsDto = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  distance_km: number;
  sortedBy: "distance" | "date";
  voluntaryToImmersion?: boolean;
};
