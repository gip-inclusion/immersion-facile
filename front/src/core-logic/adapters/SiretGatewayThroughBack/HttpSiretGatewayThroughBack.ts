import { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { from, Observable } from "rxjs";
import {
  establishmentTargets,
  getSiretIfNotSavedRoute,
  GetSiretInfo,
  GetSiretInfoError,
  getSiretInfoSchema,
  isSiretExistResponseSchema,
  LegacyHttpClientError,
  LegacyHttpServerError,
  sirenApiMissingEstablishmentMessage,
  sirenApiUnavailableSiretErrorMessage,
  SiretDto,
  siretRoute,
  tooManiSirenRequestsSiretErrorMessage,
} from "shared";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  constructor(private readonly httpClient: AxiosInstance) {}

  isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {
    return from(
      this.httpClient
        .get<unknown>(
          establishmentTargets.isEstablishmentWithSiretAlreadyRegistered.url.replace(
            ":siret",
            siret,
          ),
        )
        .then(({ data }) => {
          const isSiretAlreadyExist = isSiretExistResponseSchema.parse(data);
          return isSiretAlreadyExist;
        }),
    );
  }

  // public isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .get<unknown>(`/${siretRoute}/${siret}`)
        .then(({ data }) => {
          const getSiretInfoDto = getSiretInfoSchema.parse(data);
          return getSiretInfoDto;
        })
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
        .get<unknown>(`/${getSiretIfNotSavedRoute}/${siret}`)
        .then(({ data }) => {
          const getSiretInfoDto = getSiretInfoSchema.parse(data);
          return getSiretInfoDto;
        })
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
  [503]: sirenApiUnavailableSiretErrorMessage,
  [404]: sirenApiMissingEstablishmentMessage,
  [409]: "Establishment with this siret is already in our DB",
};
