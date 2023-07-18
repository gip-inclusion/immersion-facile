import { from, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  SearchImmersionRoutes,
} from "shared";
import { HttpClient, HttpResponse } from "shared-routes";
import {
  ContactErrorKind,
  ImmersionSearchGateway,
} from "src/core-logic/ports/ImmersionSearchGateway";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  constructor(private readonly httpClient: HttpClient<SearchImmersionRoutes>) {}

  public search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]> {
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

  public async getGroupOffersBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]> {
    const response = await this.httpClient.getOffersByGroupSlug({
      urlParams: { groupSlug },
    });

    return response.body;
  }
}
