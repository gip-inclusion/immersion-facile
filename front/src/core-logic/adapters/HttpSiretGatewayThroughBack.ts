import axios, { AxiosInstance } from "axios";
import { siretRoute } from "shared/src/routes";
import { SiretDto } from "shared/src/siret";
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
        const errorMessage = errorMessageByCode[error?.response?.status];
        if (!errorMessage) throw error;
        return errorMessage;
      });
  }
}

const errorMessageByCode: Partial<Record<number, string>> = {
  [429]: tooManiSirenRequestsSiretErrorMessage,
  [503]: sirenApiUnavailableSiretErrorMessage,
  [404]: sirenApiMissingEstablishmentMessage,
};
