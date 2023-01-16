import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  GeoPositionDto,
  LookupSearchResult,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  lookupLocationName(query: string): Promise<LookupSearchResult[]>;
  findDepartmentCodeFromPostCode(
    postCode: string,
  ): Promise<DepartmentCode | null>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
