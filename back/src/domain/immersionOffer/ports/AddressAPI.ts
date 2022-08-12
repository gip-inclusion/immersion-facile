import { AddressDto } from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";

export interface AddressAPI {
  getAddressAndPositionFromString: (
    address: string,
  ) => Promise<AddressAndPosition | undefined>;
  getCityCodeFromPosition: (
    position: GeoPositionDto,
  ) => Promise<number | undefined>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
