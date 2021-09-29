import axios, { AxiosInstance } from "axios";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../domain/core/ports/AccessTokenGateway";
import { logger as rootLogger } from "../../utils/logger";

export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  private readonly logger = rootLogger.child({
    logsource: "PoleEmploiAccessTokenGateway",
  });
  private readonly axiosInstance: AxiosInstance;

  public constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    this.axiosInstance = axios.create();
    this.axiosInstance.interceptors.request.use((request) => {
      this.logger.info(request);
      return request;
    });
    this.axiosInstance.interceptors.response.use((response) => {
      this.logger.debug(response);
      return response;
    });
  }

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    const dataAcessToken = querystring.stringify({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
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
      this.logger.error(error);
      throw error;
    }
  }
}
