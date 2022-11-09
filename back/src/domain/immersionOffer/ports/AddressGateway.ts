import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  GeoPositionDto,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  findDepartmentCodeFromPostCode(
    postCode: string,
  ): Promise<DepartmentCode | null>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
