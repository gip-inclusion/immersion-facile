import { AxiosResponse } from "axios";
import secondsToMilliseconds from "date-fns/secondsToMilliseconds";
import {
  PoleEmploiGateway,
  PoleEmploiConvention,
} from "../../../domain/convention/ports/PoleEmploiGateway";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
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
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  private url =
    "https://api.emploi-store.fr/partenaire/immersion-pro/v1/demandes-immersion";

  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

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
        const response = await this.rateLimiter.whenReady(async () => {
          const accessToken = await this.accessTokenGateway.getAccessToken(
            `application_${this.poleEmploiClientId} echangespmsmp api_immersion-prov1`, // application_${this.poleEmploiClientId}
          );
          return axios.post(this.url, {
            headers: {
              Authorization: `Bearer ${accessToken.access_token}`,
            },
            timeout: secondsToMilliseconds(10),
            poleEmploiConvention,
          });
        });
        return response;
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }
}
