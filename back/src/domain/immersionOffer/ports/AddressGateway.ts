import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
} from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";

export interface AddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  getAddressAndPositionFromString: (
    address: string,
  ) => Promise<AddressAndPosition | undefined>;
  findDepartmentCodeFromPostCode(query: string): Promise<DepartmentCode | null>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
