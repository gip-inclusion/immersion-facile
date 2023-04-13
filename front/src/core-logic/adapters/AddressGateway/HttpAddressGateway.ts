import { from, Observable } from "rxjs";
import {
  AddressAndPosition,
  addressAndPositionListSchema,
  AddressTargets,
  LookupLocationInput,
  LookupSearchResult,
  lookupSearchResultsSchema,
} from "shared";
import { HttpClient } from "http-client";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: HttpClient<AddressTargets>) {}

  private async lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });
    return lookupSearchResultsSchema.parse(response.responseBody);
  }

  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.lookupLocation(query));
  }

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
      },
    });
    return addressAndPositionListSchema.parse(response.responseBody);
  }
}
