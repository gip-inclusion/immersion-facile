import { LatLonDto } from "../latLon";
import { RomeCode } from "../rome";

export type SearchImmersionRequestDto = {
  rome?: RomeCode;
  nafDivision?: string;
  siret?: string;
  location: LatLonDto;
  distance_km: number;
};
