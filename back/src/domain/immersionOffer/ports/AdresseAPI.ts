import { LatLonDto } from "../../../shared/SearchImmersionDto";

export interface AdresseAPI {
  getPositionFromAddress: (address: string) => Promise<LatLonDto | undefined>;
  getCityCodeFromPosition: (position: LatLonDto) => Promise<number | undefined>;
}
