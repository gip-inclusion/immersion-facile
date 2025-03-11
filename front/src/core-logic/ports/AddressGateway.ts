import type { Observable } from "rxjs";
import type {
  AddressAndPosition,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(lookup: LookupAddress): Promise<AddressAndPosition[]>;
  lookupLocation$(query: LookupLocationInput): Observable<LookupSearchResult[]>;
}
