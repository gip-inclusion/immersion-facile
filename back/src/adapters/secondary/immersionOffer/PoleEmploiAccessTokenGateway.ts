import axios, { AxiosInstance } from "axios";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { createLogger } from "../../../utils/logger";
import { AccessTokenConfig } from "../../primary/appConfig";

const logger = createLogger(__filename);
export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  private readonly axiosInstance: AxiosInstance;

  public constructor(private readonly config: AccessTokenConfig) {
    this.axiosInstance = axios.create();
    this.axiosInstance.interceptors.request.use((request) => {
      logger.info(request);
      return request;
    });
    this.axiosInstance.interceptors.response.use((response) => {
      logger.debug({
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
      return response;
    });
  }

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    const dataAcessToken = querystring.stringify({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: scope,
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    try {
      const response = await this.axiosInstance.post(
        "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
        dataAcessToken,
        { headers },
      );
      return response.data;
    } catch (error: any) {
      logger.error(error);
      throw error;
    }
  }
}
