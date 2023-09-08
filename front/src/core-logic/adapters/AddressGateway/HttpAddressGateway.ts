import { from, Observable } from "rxjs";
import {
  AddressAndPosition,
  addressAndPositionListSchema,
  AddressTargets,
  LookupLocationInput,
  LookupSearchResult,
  lookupSearchResultsSchema,
  withLookupStreetAddressQueryParamsSchema,
} from "shared";
import { HttpClient } from "http-client";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: HttpClient<AddressTargets>) {}

  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.#lookupLocation(query));
  }

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: withLookupStreetAddressQueryParamsSchema.parse({
        lookup,
      }),
    });
    return addressAndPositionListSchema.parse(response.responseBody);
  }

  async #lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });
    return lookupSearchResultsSchema.parse(response.responseBody);
  }
}
