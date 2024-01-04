import { from, Observable } from "rxjs";
import { match, P } from "ts-pattern";
import {
  ContactEstablishmentRequestDto,
  GroupSlug,
  GroupWithResults,
  SearchQueryParamsDto,
  SearchResultDto,
  SearchRoutes,
  SiretAndAppellationDto,
} from "shared";
import { HttpClient } from "shared-routes";
import { routes } from "src/app/routes/routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import {
  ContactErrorKind,
  SearchGateway,
} from "src/core-logic/ports/SearchGateway";

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
          .with(
            { status: 409 },
            (): ContactErrorKind => "alreadyContactedRecently",
          )
          .with({ status: P.union(400, 404) }, logBodyAndThrow)
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
            routes
              .errorRedirect({
                title: "Groupe introuvable",
                message: `Nous n'avons pas trouvé le groupe: '${groupSlug}'`,
              })
              .push();

            return undefined as unknown as GroupWithResults;
          })
          .otherwise(otherwiseThrow),
      );
  }

  public getSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return from(
      this.httpClient
        .getSearchResult({
          queryParams: params,
        })
        .then((result) =>
          match(result)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: P.union(400, 404) }, logBodyAndThrow)
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
          queryParams: searchParams,
        })
        .then((result) =>
          match(result)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: P.union(400) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
