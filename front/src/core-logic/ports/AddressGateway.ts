import {
  AddressAndPosition,
  DepartmentCode,
  LookupAddress,
  Postcode,
} from "shared/src/address/address.dto";

export interface AddressGateway {
  lookupStreetAddress(lookup: LookupAddress): Promise<AddressAndPosition[]>;
  findDepartmentCodeFromPostCode(
    postcode: Postcode,
  ): Promise<DepartmentCode | null>;
}
