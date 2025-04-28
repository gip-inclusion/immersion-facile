import { type Observable, Subject } from "rxjs";
import type { AddressAndPosition, LookupSearchResult } from "shared";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class TestAddressGateway implements AddressGateway {
  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();
  public lookupStreetAddressResults$ = new Subject<AddressAndPosition[]>();

  public lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }

  public lookupStreetAddress$(): Observable<AddressAndPosition[]> {
    return this.lookupStreetAddressResults$;
  }
}
