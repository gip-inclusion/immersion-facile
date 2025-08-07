import type { Observable } from "rxjs";
import type {
  AddressWithCountryCodeAndPosition,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress$(
    lookup: LookupAddress,
    countryCode: SupportedCountryCode,
  ): Observable<AddressWithCountryCodeAndPosition[]>;
  lookupLocation$(query: LookupLocationInput): Observable<LookupSearchResult[]>;
}
