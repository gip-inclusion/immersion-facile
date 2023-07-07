import { from, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  SearchTargets,
} from "shared";
import { HttpClient, HttpResponse } from "http-client";
import {
  ContactErrorKind,
  ImmersionSearchGateway,
} from "src/core-logic/ports/ImmersionSearchGateway";

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
  ): Promise<void | ContactErrorKind> {
    const response = await this.httpClient
      .contactEstablishment({
        body: params,
      })
      .catch((error): HttpResponse<string> | never => {
        if (error.httpStatusCode) {
          return { responseBody: error.message, status: error.httpStatusCode };
        }
        throw error;
      });

    if (response.status === 409) return "alreadyContactedRecently";
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
