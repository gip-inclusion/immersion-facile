import Bottleneck from "bottleneck";
import { secondsToMilliseconds } from "date-fns";
import querystring from "querystring";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
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

const poleEmploiAccessTokenMaxRequestsPerSeconds = 3;

export class PoleEmploiAccessTokenGateway implements AccessTokenGateway {
  public constructor(
    private readonly accessTokenConfig: AccessTokenConfig,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    return this.retryStrategy.apply(async () => {
      try {
        const response = await this.limiter.schedule(() =>
          createAxiosInstance(logger).post(
            `${this.accessTokenConfig.peEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
            querystring.stringify({
              grant_type: "client_credentials",
              client_id: this.accessTokenConfig.clientId,
              client_secret: this.accessTokenConfig.clientSecret,
              scope,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              timeout: secondsToMilliseconds(10),
            },
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

  private limiter = new Bottleneck({
    reservoir: poleEmploiAccessTokenMaxRequestsPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: poleEmploiAccessTokenMaxRequestsPerSeconds,
  });
}
