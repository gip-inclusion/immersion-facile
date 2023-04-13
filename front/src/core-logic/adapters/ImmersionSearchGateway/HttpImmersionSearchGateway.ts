import { from, Observable } from "rxjs";

import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  SearchTargets,
} from "shared";

import { HttpClient } from "http-client";

import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  constructor(private readonly httpClient: HttpClient<SearchTargets>) {}

  public search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]> {
    return from(
      this.httpClient
        .searchImmersion({
          queryParams: searchParams,
        })
        .then(({ responseBody }) => responseBody),
    );
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await this.httpClient.contactEstablishment({
      body: params,
    });
  }

  public async getGroupOffersBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]> {
    const response = await this.httpClient.getOffersByGroupSlug({
      urlParams: { groupSlug },
    });

    return response.responseBody;
  }
}
