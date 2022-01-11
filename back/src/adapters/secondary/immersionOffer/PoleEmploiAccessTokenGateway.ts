import { secondsToMilliseconds } from "date-fns";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetriableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import {
  createAxiosInstance,
  isRetriableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { AccessTokenConfig } from "../../primary/appConfig";

const logger = createLogger(__filename);
export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  public constructor(
    private readonly config: AccessTokenConfig,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

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

    return this.retryStrategy.apply(async () => {
      try {
        const response = await this.rateLimiter.whenReady(() =>
          createAxiosInstance(logger).post(
            "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
            dataAcessToken,
            { headers, timeout: secondsToMilliseconds(10) },
          ),
        );
        return response.data;
      } catch (error: any) {
        if (isRetriableError(logger, error)) throw new RetriableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }
}
