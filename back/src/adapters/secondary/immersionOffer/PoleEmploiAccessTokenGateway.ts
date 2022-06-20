import { secondsToMilliseconds } from "date-fns";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { AccessTokenConfig } from "../../primary/config/appConfig";

const logger = createLogger(__filename);
export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  public constructor(
    private readonly accessTokenConfig: AccessTokenConfig,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    const dataAccessToken = querystring.stringify({
      grant_type: "client_credentials",
      client_id: this.accessTokenConfig.clientId,
      client_secret: this.accessTokenConfig.clientSecret,
      scope,
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    return this.retryStrategy.apply(async () => {
      try {
        const response = await this.rateLimiter.whenReady(() =>
          createAxiosInstance(logger).post(
            `${this.accessTokenConfig.peEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
            dataAccessToken,
            { headers, timeout: secondsToMilliseconds(10) },
          ),
        );
        return response.data;
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }
}
