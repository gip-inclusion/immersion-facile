import { from, type Observable } from "rxjs";
import type {
  AddressRoutes,
  AddressWithCountryCodeAndPosition,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
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
    countryCode: SupportedCountryCode,
  ): Observable<AddressWithCountryCodeAndPosition[]> {
    return from(this.#lookupStreetAddress(lookup, countryCode));
  }

  async #lookupStreetAddress(
    lookup: LookupAddress,
    countryCode: SupportedCountryCode,
  ): Promise<AddressWithCountryCodeAndPosition[]> {
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
        countryCode,
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
