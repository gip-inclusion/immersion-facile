import { AxiosError, AxiosResponse } from "axios";
import { from, Observable } from "rxjs";
import {
  GetSiretInfo,
  GetSiretInfoError,
  LegacyHttpClientError,
  LegacyHttpServerError,
  siretApiMissingEstablishmentMessage,
  siretApiUnavailableSiretErrorMessage,
  SiretDto,
  SiretTargets,
  tooManiSirenRequestsSiretErrorMessage,
} from "shared";
import { HttpClient } from "http-client";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  constructor(private readonly httpClient: HttpClient<SiretTargets>) {}

  isSiretAlreadySaved(siret: SiretDto): Observable<boolean> {
    return from(
      this.httpClient
        .isSiretAlreadySaved({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody),
    );
  }

  // public isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfo({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody)
        .catch((error) => {
          if (
            error instanceof LegacyHttpClientError ||
            error instanceof LegacyHttpServerError
          ) {
            //TODO Changer le contract de HttpClientError/HttpServerError pour avoir le status en public sur l'instance directement
            // (l'info doit être porté par le domaine et forcément définie)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const err = error.cause! as AxiosError;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const resp = err.response! as AxiosResponse;
            //TODO errorMessageByCode[error.status];
            const errorMessage = errorMessageByCode[resp.status];
            if (errorMessage) return errorMessage;
          }
          throw new Error("Une erreur non managée est survenue", {
            cause: error,
          });
        }),
    );
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfoIfNotAlreadySaved({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody)
        .catch((error) => {
          if (
            error instanceof LegacyHttpClientError ||
            error instanceof LegacyHttpServerError
          ) {
            //TODO Changer le contract de HttpClientError/HttpServerError pour avoir le status en public sur l'instance directement
            // (l'info doit être porté par le domaine et forcément définie)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const err = error.cause! as AxiosError;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const resp = err.response! as AxiosResponse;
            //TODO errorMessageByCode[error.status];
            const errorMessage = errorMessageByCode[resp.status];
            if (errorMessage) return errorMessage;
          }
          throw new Error("Une erreur non managée est survenue", {
            cause: error,
          });
        }),
    );
  }
}

const errorMessageByCode: Partial<Record<number, GetSiretInfoError>> = {
  [429]: tooManiSirenRequestsSiretErrorMessage,
  [503]: siretApiUnavailableSiretErrorMessage,
  [404]: siretApiMissingEstablishmentMessage,
  [409]: "Establishment with this siret is already in our DB",
};
