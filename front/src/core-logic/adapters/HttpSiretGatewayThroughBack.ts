import axios, { AxiosInstance } from "axios";
import { siretRoute } from "src/shared/routes";
import { SiretDto } from "src/shared/siret";
import {
  GetSiretInfo,
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
        if (this.isErrorCode(error, 429))
          return tooManiSirenRequestsSiretErrorMessage;
        if (this.isErrorCode(error, 503))
          return sirenApiUnavailableSiretErrorMessage;
        if (this.isErrorCode(error, 404))
          return sirenApiMissingEstablishmentMessage;
        return Promise.reject(error);
      });
  }

  private isErrorCode(error: any, errorCode: number): boolean {
    return error.response.status === errorCode;
  }
}
