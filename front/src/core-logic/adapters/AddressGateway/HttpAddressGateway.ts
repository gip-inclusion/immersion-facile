import { from, Observable } from "rxjs";
import {
  AddressAndPosition,
  AddressRoutes,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";
import { HttpClient } from "shared-routes";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: HttpClient<AddressRoutes>) {}

  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.#lookupLocation(query));
  }

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
      },
    });
    if (response.status === 200) return response.body;
    throw new Error(JSON.stringify(response));
  }

  async #lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });
    if (response.status === 200) return response.body;
    throw new Error(JSON.stringify(response));
  }
}
