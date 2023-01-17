import {
  AddressAndPosition,
  DepartmentCode,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
  Postcode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(lookup: LookupAddress): Promise<AddressAndPosition[]>;
  lookupLocation(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  findDepartmentCodeFromPostCode(
    postcode: Postcode,
  ): Promise<DepartmentCode | null>;
}
