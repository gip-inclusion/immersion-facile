import { type Observable, Subject } from "rxjs";
import type {
  AddressWithCountryCodeAndPosition,
  LookupSearchResult,
} from "shared";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class TestAddressGateway implements AddressGateway {
  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();
  public lookupStreetAddressResults$ = new Subject<
    AddressWithCountryCodeAndPosition[]
  >();

  public lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }

  public lookupStreetAddress$(): Observable<
    AddressWithCountryCodeAndPosition[]
  > {
    return this.lookupStreetAddressResults$;
  }
}
