import { DepartmentCode } from "shared/src/address/address.dto";
import { AddressAndPosition } from "shared/src/apiAdresse/AddressAPI";

export interface ApiAddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  findDepartmentCodeFromPostCode(query: string): Promise<DepartmentCode | null>;
}
