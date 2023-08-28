import { from, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchQueryParamsDto,
  SearchResultDto,
  SearchRoutes,
  SiretAndAppellationDto,
} from "shared";
import { HttpClient, HttpResponse } from "shared-routes";
import {
  ContactErrorKind,
  SearchGateway,
} from "src/core-logic/ports/SearchGateway";

export class HttpSearchGateway implements SearchGateway {
  constructor(private readonly httpClient: HttpClient<SearchRoutes>) {}

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void | ContactErrorKind> {
    const response = await this.httpClient
      .contactEstablishment({
        body: params,
      })
      .catch((error): HttpResponse<number, string> | never => {
        if (error.httpStatusCode) {
          return { body: error.message, status: error.httpStatusCode };
        }
        throw error;
      });

    if (response.status === 409) return "alreadyContactedRecently";
  }

  public async getGroupSearchResultsBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchResultDto[]> {
    const response = await this.httpClient.getOffersByGroupSlug({
      urlParams: { groupSlug },
    });

    return response.body;
  }

  public getSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return from(
      this.httpClient
        .getImmersionOffer({
          queryParams: params,
        })
        .then((result) => {
          if (result.status === 200) return result.body;
          throw new Error(result.body.message);
        }),
    );
  }

  public search$(
    searchParams: SearchQueryParamsDto,
  ): Observable<SearchResultDto[]> {
    return from(
      this.httpClient
        .searchImmersion({
          queryParams: searchParams,
        })
        .then((result) => {
          if (result.status === 200) return result.body;
          throw new Error(result.body.message);
        }),
    );
  }
}
