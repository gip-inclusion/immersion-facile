import { Observable, Subject } from "rxjs";
import { AddressAndPosition, DepartmentCode, LookupSearchResult } from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class TestAddressGateway implements AddressGateway {
  lookupStreetAddress(): Promise<AddressAndPosition[]> {
    throw new Error("Method not implemented.");
  }
  lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }
  findDepartmentCodeFromPostCode(): Promise<DepartmentCode | null> {
    throw new Error("Method not implemented.");
  }

  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();
}
