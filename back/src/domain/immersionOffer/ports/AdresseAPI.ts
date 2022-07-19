import { AddressDto } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AdresseAPI {
  getPositionFromAddress: (address: string) => Promise<LatLonDto | undefined>;
  getCityCodeFromPosition: (position: LatLonDto) => Promise<number | undefined>;
  getAddressFromPosition(position: LatLonDto): Promise<AddressDto | undefined>;
}
