import { from, Observable } from "rxjs";
import { match, P } from "ts-pattern";
import {
  GetSiretInfo,
  GetSiretInfoError,
  siretApiMissingEstablishmentMessage,
  siretApiUnavailableSiretErrorMessage,
  SiretDto,
  SiretRoutes,
  tooManiSirenRequestsSiretErrorMessage,
} from "shared";
import { HttpClient, HttpResponse } from "shared-routes";
import type { ResponsesToHttpResponse } from "shared-routes/defineRoutes";
import { otherwiseThrow } from "src/core-logic/adapters/otherwiseThrow";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  constructor(private readonly httpClient: HttpClient<SiretRoutes>) {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfo({ urlParams: { siret } })
        .then(handleSiretResponses),
    );
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfoIfNotAlreadySaved({ urlParams: { siret } })
        .then(handleSiretResponses),
    );
  }

  public isSiretAlreadySaved(siret: SiretDto): Observable<boolean> {
    return from(
      this.httpClient
        .isSiretAlreadySaved({ urlParams: { siret } })
        .then(getBodyIfStatus200ElseThrow),
    );
  }
}

const handleSiretResponses = (
  response: ResponsesToHttpResponse<
    | SiretRoutes["getSiretInfo"]["responses"]
    | SiretRoutes["getSiretInfoIfNotAlreadySaved"]["responses"]
  >,
) =>
  match(response)
    .with({ status: 200 }, ({ body }) => body)
    .with({ status: 400 }, ({ body, status }) => {
      // eslint-disable-next-line no-console
      console.error(body.errors);
      return errorMessageByCode[status];
    })
    .with(
      { status: P.union(404, 409, 429, 503) },
      ({ status }) => errorMessageByCode[status],
    )
    .otherwise(otherwiseThrow);

const getBodyIfStatus200ElseThrow = <R extends HttpResponse<number, unknown>>(
  response: R,
): R["status"] extends 200 ? R["body"] : never => {
  if (response.status !== 200)
    throw new Error("Une erreur non managée est survenue (pas dans le catch)");

  return response.body as any;
};

const errorMessageByCode = {
  [429]: tooManiSirenRequestsSiretErrorMessage,
  [503]: siretApiUnavailableSiretErrorMessage,
  [404]: siretApiMissingEstablishmentMessage,
  [400]: "Erreur sur le siret fourni",
  [409]: "Establishment with this siret is already in our DB",
} satisfies Record<number, GetSiretInfoError>;
