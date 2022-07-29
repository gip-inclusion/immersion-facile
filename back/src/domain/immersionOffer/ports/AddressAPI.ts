import { AddressDto } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";

export type AddressAndPosition = {
  position: LatLonDto;
  address: AddressDto;
};
export interface AddressAPI {
  getAddressAndPositionFromString: (
    address: string,
  ) => Promise<AddressAndPosition | undefined>;
  getCityCodeFromPosition: (position: LatLonDto) => Promise<number | undefined>;
  getAddressFromPosition(position: LatLonDto): Promise<AddressDto | undefined>;
}
