import type { Observable } from "rxjs";
import type {
  AddressAndPositionWithFormattedAddress,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress$(
    lookup: LookupAddress,
    countryCode: SupportedCountryCode,
  ): Observable<AddressAndPositionWithFormattedAddress[]>;
  lookupLocation$(query: LookupLocationInput): Observable<LookupSearchResult[]>;
}
