import type { Observable } from "rxjs";
import type {
  AddressWithCountryCodeAndPosition,
  BusinessAddress,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress$(
    lookup: LookupAddress | BusinessAddress,
    countryCode: SupportedCountryCode,
  ): Observable<AddressWithCountryCodeAndPosition[]>;
  lookupLocation$(query: LookupLocationInput): Observable<LookupSearchResult[]>;
}
