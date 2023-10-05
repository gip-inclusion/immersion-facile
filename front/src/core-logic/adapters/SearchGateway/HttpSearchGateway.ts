import { from, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  GroupSlug,
  GroupWithResults,
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
          return {
            body: error.message,
            status: error.httpStatusCode,
            headers: error.headers,
          };
        }
        throw error;
      });

    if (response.status === 409) return "alreadyContactedRecently";
  }

  public async getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults> {
    const response = await this.httpClient.getGroupBySlug({
      urlParams: { groupSlug },
    });

    return response.body;
  }

  public getSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return from(
      this.httpClient
        .getSearchResult({
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
        .search({
          queryParams: searchParams,
        })
        .then((result) => {
          if (result.status === 200) return result.body;
          throw new Error(result.body.message);
        }),
    );
  }
}
