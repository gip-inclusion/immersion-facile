import { LatLonDto } from "../../../shared/latLon";

export interface AdresseAPI {
  getPositionFromAddress: (address: string) => Promise<LatLonDto | undefined>;
  getCityCodeFromPosition: (position: LatLonDto) => Promise<number | undefined>;
}
