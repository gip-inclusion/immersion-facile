import {
  AddressAndPosition,
  DepartmentCode,
  LookupAddress,
  Postcode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(lookup: LookupAddress): Promise<AddressAndPosition[]>;
  findDepartmentCodeFromPostCode(
    postcode: Postcode,
  ): Promise<DepartmentCode | null>;
}
