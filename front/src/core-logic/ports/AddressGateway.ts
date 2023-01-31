import { Observable } from "rxjs";
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
  lookupLocation$(query: LookupLocationInput): Observable<LookupSearchResult[]>;
  findDepartmentCodeFromPostCode(
    postcode: Postcode,
  ): Promise<DepartmentCode | null>;
}
