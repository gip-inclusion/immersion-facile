import axios from "axios";
import { from, Observable } from "rxjs";
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
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  constructor(private readonly httpClient: HttpClient<SiretRoutes>) {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfo({ urlParams: { siret } })
        .then(getBodyIfStatus200ElseThrow)
        .catch(handleSiretApiError),
    );
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfoIfNotAlreadySaved({ urlParams: { siret } })
        .then(getBodyIfStatus200ElseThrow)
        .catch(handleSiretApiError),
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

const getBodyIfStatus200ElseThrow = <R extends HttpResponse<number, unknown>>(
  response: R,
): R["status"] extends 200 ? R["body"] : never => {
  if (response.status !== 200)
    throw new Error("Une erreur non managée est survenue (pas dans le catch)");

  return response.body as any;
};

const errorMessageByCode: Partial<Record<number, GetSiretInfoError>> = {
  [429]: tooManiSirenRequestsSiretErrorMessage,
  [503]: siretApiUnavailableSiretErrorMessage,
  [404]: siretApiMissingEstablishmentMessage,
  [409]: "Establishment with this siret is already in our DB",
};

const handleSiretApiError = (error: Error) => {
  if (axios.isAxiosError(error.cause) && error.cause.response?.status) {
    const errorMessage = errorMessageByCode[error.cause.response?.status];
    if (errorMessage) return errorMessage;
  }

  throw new Error("Une erreur non managée est survenue", {
    cause: error,
  });
};
