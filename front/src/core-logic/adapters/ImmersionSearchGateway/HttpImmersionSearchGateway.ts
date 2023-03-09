import { from, map, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRoute,
  EstablishmentGroupSlug,
  immersionOffersRoute,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  searchImmersionsSchema,
} from "shared";

import {
  createTargets,
  CreateTargets,
  HttpClient,
  HttpResponse,
  Target,
} from "http-client";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  constructor(private readonly httpClient: HttpClient<SearchResultsTargets>) {}

  public search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]> {
    return from(
      this.httpClient.searchImmersion({
        queryParams: searchParams,
      }),
    ).pipe(map(validateSearchImmersions));
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
      urlParams: { slug: groupSlug },
    });
    return searchImmersionsSchema.parse(response.responseBody);
  }
}

const validateSearchImmersions = ({ responseBody }: HttpResponse<unknown>) =>
  searchImmersionsSchema.parse(responseBody);

const getSearchResultsByGroupUrl = "/group-offers/:slug";

export type SearchResultsTargets = CreateTargets<{
  getOffersByGroupSlug: Target<
    void,
    void,
    void,
    typeof getSearchResultsByGroupUrl
  >;
  searchImmersion: Target<void, SearchImmersionQueryParamsDto>;
  contactEstablishment: Target<ContactEstablishmentRequestDto>;
}>;

export const searchResultsTargets = createTargets<SearchResultsTargets>({
  getOffersByGroupSlug: {
    method: "GET",
    url: getSearchResultsByGroupUrl,
  },
  searchImmersion: {
    method: "GET",
    url: `/${immersionOffersRoute}`,
  },
  contactEstablishment: {
    method: "POST",
    url: `/${contactEstablishmentRoute}`,
  },
});
