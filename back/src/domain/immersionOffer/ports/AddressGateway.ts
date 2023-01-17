import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  GeoPositionDto,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  lookupLocationName(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  findDepartmentCodeFromPostCode(
    postCode: string,
  ): Promise<DepartmentCode | null>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
