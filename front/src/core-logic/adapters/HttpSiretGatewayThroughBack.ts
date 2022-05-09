import axios, { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { getSiretIfNotSavedRoute, siretRoute } from "shared/src/routes";
import { SiretDto } from "shared/src/siret";
import {
  GetSiretInfo,
  GetSiretInfoError,
  sirenApiMissingEstablishmentMessage,
  sirenApiUnavailableSiretErrorMessage,
  SiretGatewayThroughBack,
  tooManiSirenRequestsSiretErrorMessage,
} from "../ports/SiretGatewayThroughBack";
const prefix = "api";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  private axiosInstance: AxiosInstance;

  constructor(baseURL = `/${prefix}`) {
    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  public getSiretInfo(siret: SiretDto): Promise<GetSiretInfo> {
    return this.axiosInstance
      .get(`/${siretRoute}/${siret}`)
      .then((response) => response.data)
      .catch((error) => {
        const errorMessage = errorMessageByCode[error?.response?.status];
        if (!errorMessage) throw error;
        return errorMessage;
      });
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.axiosInstance
        .get(`/${getSiretIfNotSavedRoute}/${siret}`)
        .then((response) => response.data)
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
