import { AxiosResponse } from "axios";
import secondsToMilliseconds from "date-fns/secondsToMilliseconds";
import { AbsoluteUrl } from "shared";
import {
  PoleEmploiGateway,
  PoleEmploiConvention,
} from "../../../../domain/convention/ports/PoleEmploiGateway";
import { AccessTokenGateway } from "../../../../domain/core/ports/AccessTokenGateway";
import { RateLimiter } from "../../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../../domain/core/ports/RetryStrategy";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  private peConventionBroadcastUrl: AbsoluteUrl;

  constructor(
    readonly peApiUrl: AbsoluteUrl,
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {
    this.peConventionBroadcastUrl = `${peApiUrl}/partenaire/immersion-pro/v1/demandes-immersion`;
  }

  public async notifyOnConventionUpdated(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<void> {
    const response = await this.postPoleEmploiConvention(poleEmploiConvention);

    if (![200, 201].includes(response.status)) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Could not notify Pole-Emploi : ${response.status} ${response.statusText}`,
        ),
      );
    }
  }

  private async postPoleEmploiConvention(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<AxiosResponse<void>> {
    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        logger.info(poleEmploiConvention, "Sending convention to PE");
        const response = await this.rateLimiter.whenReady(async () => {
          const accessToken = await this.accessTokenGateway.getAccessToken(
            `echangespmsmp api_immersion-prov1`,
          );

          const peResponse = await axios.post(
            this.peConventionBroadcastUrl,
            poleEmploiConvention,
            {
              headers: {
                Authorization: `Bearer ${accessToken.access_token}`,
              },
              timeout: secondsToMilliseconds(10),
            },
          );
          logger.info({ status: peResponse.status }, "Response status from PE");
          return peResponse;
        });
        return response;
      } catch (error: any) {
        logger.info(error, "Error from PE");
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }
}
