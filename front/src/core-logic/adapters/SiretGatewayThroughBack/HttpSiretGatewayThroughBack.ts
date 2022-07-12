import axios, { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import {
  formAlreadyExistsRoute,
  getSiretIfNotSavedRoute,
  siretRoute,
} from "shared/src/routes";
import {
  GetSiretInfo,
  GetSiretInfoError,
  getSiretInfoSchema,
  isSiretExistResponseSchema,
  sirenApiMissingEstablishmentMessage,
  sirenApiUnavailableSiretErrorMessage,
  SiretDto,
  tooManiSirenRequestsSiretErrorMessage,
} from "shared/src/siret";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

const prefix = "api";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  private axiosInstance: AxiosInstance;

  constructor(baseURL = `/${prefix}`) {
    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {
    return from(
      this.axiosInstance
        .get<unknown>(`/${formAlreadyExistsRoute}/${siret}`)
        .then(({ data }) => {
          const isSiretAlreadyExist = validateDataFromSchema(
            isSiretExistResponseSchema,
            data,
          );
          if (isSiretAlreadyExist instanceof Error) throw isSiretAlreadyExist;
          return isSiretAlreadyExist;
        }),
    );
  }

  // public isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.axiosInstance
        .get<unknown>(`/${siretRoute}/${siret}`)
        .then(({ data }) => {
          const getSiretInfoDto = validateDataFromSchema(
            getSiretInfoSchema,
            data,
          );
          if (getSiretInfoDto instanceof Error) throw getSiretInfoDto;
          return getSiretInfoDto;
        })
        .catch((error) => {
          const errorMessage = errorMessageByCode[error?.response?.status];
          if (!errorMessage) throw error;
          return errorMessage;
        }),
    );
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.axiosInstance
        .get<unknown>(`/${getSiretIfNotSavedRoute}/${siret}`)
        .then(({ data }) => {
          const getSiretInfoDto = validateDataFromSchema(
            getSiretInfoSchema,
            data,
          );
          if (getSiretInfoDto instanceof Error) throw getSiretInfoDto;
          return getSiretInfoDto;
        })
        .catch((error) => {
          const errorMessage = errorMessageByCode[error?.response?.status];
          if (!errorMessage) throw error;
          return errorMessage;
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
