import { Observable, from } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  GroupSlug,
  GroupWithResults,
  SearchQueryParamsDto,
  SearchResultDto,
  SearchResultQuery,
  SearchRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import {
  ContactErrorKind,
  SearchGateway,
} from "src/core-logic/ports/SearchGateway";
import { P, match } from "ts-pattern";

export class HttpSearchGateway implements SearchGateway {
  constructor(private readonly httpClient: HttpClient<SearchRoutes>) {}

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void | ContactErrorKind> {
    return this.httpClient
      .contactEstablishment({
        body: params,
      })
      .then((response) =>
        match(response)
          .with({ status: 201 }, () => undefined)
          .with({ status: 400 }, throwBadRequestWithExplicitMessage)
          .with({ status: 404 }, logBodyAndThrow)
          .with(
            { status: 409 },
            (): ContactErrorKind => "alreadyContactedRecently",
          )
          .otherwise(otherwiseThrow),
      );
  }

  public async getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults> {
    return this.httpClient
      .getGroupBySlug({
        urlParams: { groupSlug },
      })
      .then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .with({ status: P.union(404) }, () => {
            throw new Error(
              `Nous n'avons pas trouvé le groupe: '${groupSlug}'`,
            );
          })
          .otherwise(otherwiseThrow),
      );
  }

  public getSearchResult$(
    params: SearchResultQuery,
  ): Observable<SearchResultDto> {
    return from(
      this.httpClient
        .getSearchResult({
          queryParams: params,
        })
        .then((result) =>
          match(result)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 404 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public search$(
    searchParams: SearchQueryParamsDto,
  ): Observable<SearchResultDto[]> {
    return from(
      this.httpClient
        .search({
          queryParams: {
            ...searchParams,
            establishmentSearchableBy: "jobSeekers",
          },
        })
        .then((result) =>
          match(result)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
