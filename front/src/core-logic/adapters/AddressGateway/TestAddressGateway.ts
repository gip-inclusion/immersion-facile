import { type Observable, Subject } from "rxjs";
import type { Location, LookupSearchResult } from "shared";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class TestAddressGateway implements AddressGateway {
  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();

  public lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }

  public lookupStreetAddress(): Promise<Location[]> {
    throw new Error("Method not implemented.");
  }
}
