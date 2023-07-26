import axios from "axios";
import Bottleneck from "bottleneck";
import { secondsToMilliseconds } from "date-fns";
import querystring from "querystring";
import { AbsoluteUrl } from "shared";
import { HttpClient, HttpResponse } from "http-client";
import {
  GetAccessTokenResponse,
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../../domain/convention/ports/PoleEmploiGateway";
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
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { AccessTokenConfig } from "../../primary/config/appConfig";
import { InMemoryCachingGateway } from "../core/InMemoryCachingGateway";
import { getPeTestPrefix, PoleEmploiTargets } from "./PoleEmploi.targets";

const logger = createLogger(__filename);

const poleEmploiMaxRequestsPerSeconds = 3;

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  private limiter = new Bottleneck({
    reservoir: poleEmploiMaxRequestsPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: poleEmploiMaxRequestsPerSeconds,
  });

  private peTestPrefix: "test" | "";

  constructor(
    private readonly httpClient: HttpClient<PoleEmploiTargets>,
    private readonly caching: InMemoryCachingGateway<GetAccessTokenResponse>,
    peApiUrl: AbsoluteUrl,
    private readonly accessTokenConfig: AccessTokenConfig,
    private readonly retryStrategy: RetryStrategy,
  ) {
    this.peTestPrefix = getPeTestPrefix(peApiUrl);
  }

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    return this.caching.caching(scope, () =>
      this.retryStrategy.apply(() =>
        this.limiter.schedule(() =>
          createAxiosInstance(logger)
            .post(
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
            )
            .then((response) => response.data)
            .catch((error) => {
              if (isRetryableError(logger, error))
                throw new RetryableError(error);
              logAxiosError(logger, error);
              throw error;
            }),
        ),
      ),
    );
  }

  public async notifyOnConventionUpdated(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    logger.info({
      _title: "PeBroadcast",
      status: "start",
      peConvention: {
        peId: poleEmploiConvention.id,
        originalId: poleEmploiConvention.originalId,
      },
    });
    return this.postPoleEmploiConvention(poleEmploiConvention)
      .then((response) => {
        logger.info({
          _title: "PeBroadcast",
          status: "success",
          httpStatus: response.status,
          peConvention: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
        });
        return { status: response.status as 200 | 201 };
      })
      .catch((error) => {
        if (!axios.isAxiosError(error) || !error.response) {
          logger.error({
            _title: "PeBroadcast",
            status: "notAxiosErrorOrNoResponse",
            error,
            peConvention: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });
          throw error;
        }

        if (error.response.status === 404) {
          logger.error({
            _title: "PeBroadcast",
            status: "notFoundOrMismatch",
            httpStatus: error.response.status,
            message: error.response.data?.message,
            peConvention: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });
          return {
            status: 404,
            message: error.response.data?.message,
          };
        }

        const errorObject = {
          _title: "PeBroadcast",
          status: "unknownAxiosError",
          httpStatus: error.response.status,
          message: error.message,
          axiosBody: error.response.data,
          peConvention: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
        };
        logger.error(errorObject);
        notifyObjectDiscord(errorObject);

        return {
          status: error.response.status,
          message: error.response.data?.message,
        };
      });
  }

  private async postPoleEmploiConvention(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<HttpResponse<void>> {
    const accessTokenResponse = await this.getAccessToken(
      `echangespmsmp api_${this.peTestPrefix}immersion-prov2`,
    );

    return this.limiter.schedule(() =>
      this.httpClient.broadcastConvention({
        body: poleEmploiConvention,
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }),
    );
  }
}
