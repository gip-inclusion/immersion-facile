import { Observable, Subject } from "rxjs";
import { AddressAndPosition, LookupSearchResult } from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class TestAddressGateway implements AddressGateway {
  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();

  public lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }

  public lookupStreetAddress(): Promise<AddressAndPosition[]> {
    throw new Error("Method not implemented.");
  }
}
