import { type Observable, from } from "rxjs";
import type {
  AddressAndPosition,
  AddressRoutes,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";
import { match } from "ts-pattern";

export class HttpAddressGateway implements AddressGateway {
  constructor(private readonly httpClient: HttpClient<AddressRoutes>) {}

  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.#lookupLocation(query));
  }

  public lookupStreetAddress$(
    lookup: LookupAddress,
  ): Observable<AddressAndPosition[]> {
    return from(this.#lookupStreetAddress(lookup));
  }

  async #lookupStreetAddress(
    lookup: LookupAddress,
  ): Promise<AddressAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
      },
    });

    return match(response)
      .with({ status: 200 }, ({ body }) => body)
      .with({ status: 400 }, throwBadRequestWithExplicitMessage)
      .otherwise(otherwiseThrow);
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
      .otherwise(otherwiseThrow);
  }
}
