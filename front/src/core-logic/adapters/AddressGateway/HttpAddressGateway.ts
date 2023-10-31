import { from, Observable } from "rxjs";
import { match } from "ts-pattern";
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

    return match(response)
      .with({ status: 200 }, ({ body }) => body)
      .with({ status: 400 }, ({ body }) => {
        // eslint-disable-next-line no-console
        console.error(body);
        throw new Error(body.errors);
      })
      .otherwise((unhandledResponse) => {
        throw new Error(JSON.stringify(unhandledResponse));
      });
  }

  async #lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });

    return match(response)
      .with({ status: 200 }, ({ body }) => body)

      .otherwise((unhandledResponse) => {
        throw new Error(JSON.stringify(unhandledResponse));
      });
  }
}
