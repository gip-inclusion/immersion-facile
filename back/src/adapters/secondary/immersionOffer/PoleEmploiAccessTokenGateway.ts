import { AxiosInstance } from "axios";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { AccessTokenConfig } from "../../primary/appConfig";

const logger = createLogger(__filename);
export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  public constructor(private readonly config: AccessTokenConfig) {}

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
      const response = await createAxiosInstance(logger).post(
        "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
        dataAcessToken,
        { headers },
      );
      return response.data;
    } catch (error: any) {
      logAxiosError(logger, error);
      throw error;
    }
  }
}
