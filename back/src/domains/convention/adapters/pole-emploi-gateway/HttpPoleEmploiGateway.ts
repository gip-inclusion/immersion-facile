import querystring from "querystring";
import axios from "axios";
import Bottleneck from "bottleneck";
import { secondsToMilliseconds } from "date-fns";
import { AbsoluteUrl, castError } from "shared";
import { HttpClient } from "shared-routes";
import { AccessTokenConfig } from "../../../../config/bootstrap/appConfig";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import {
  notifyDiscord,
  notifyObjectDiscord,
} from "../../../../utils/notifyDiscord";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import {
  RetryStrategy,
  RetryableError,
} from "../../../core/retry-strategy/ports/RetryStrategy";
import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
  PoleEmploiGetAccessTokenResponse,
} from "../../ports/PoleEmploiGateway";
import { PoleEmploiRoutes, getPeTestPrefix } from "./PoleEmploiRoutes";

const logger = createLogger(__filename);

const poleEmploiCommonMaxRequestsPerInterval = 1;
const poleEmploiBroadcastMaxRequestPerInterval = 3;
const rate_ms = 1250;

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  // Common limiter with 1 call every 1.2s
  #commonlimiter = new Bottleneck({
    reservoir: poleEmploiCommonMaxRequestsPerInterval,
    reservoirRefreshInterval: rate_ms,
    reservoirRefreshAmount: poleEmploiCommonMaxRequestsPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / poleEmploiCommonMaxRequestsPerInterval),
  });

  // convention broacast limiter with 3 calls every 1.2s
  #broadcastlimiter = new Bottleneck({
    reservoir: poleEmploiBroadcastMaxRequestPerInterval,
    reservoirRefreshInterval: rate_ms,
    reservoirRefreshAmount: poleEmploiBroadcastMaxRequestPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / poleEmploiBroadcastMaxRequestPerInterval),
  });

  #peTestPrefix: "test" | "";
  #isDev: boolean;

  readonly #httpClient: HttpClient<PoleEmploiRoutes>;

  readonly #caching: InMemoryCachingGateway<PoleEmploiGetAccessTokenResponse>;

  readonly #accessTokenConfig: AccessTokenConfig;

  readonly #retryStrategy: RetryStrategy;

  constructor(
    httpClient: HttpClient<PoleEmploiRoutes>,
    caching: InMemoryCachingGateway<PoleEmploiGetAccessTokenResponse>,
    peApiUrl: AbsoluteUrl,
    accessTokenConfig: AccessTokenConfig,
    retryStrategy: RetryStrategy,
    isDev = false,
  ) {
    this.#peTestPrefix = getPeTestPrefix(peApiUrl);
    this.#accessTokenConfig = accessTokenConfig;
    this.#caching = caching;
    this.#httpClient = httpClient;
    this.#retryStrategy = retryStrategy;
    this.#isDev = isDev;
  }

  public async getAccessToken(
    scope: string,
  ): Promise<PoleEmploiGetAccessTokenResponse> {
    return this.#caching.caching(scope, () =>
      this.#retryStrategy.apply(() =>
        this.#commonlimiter.schedule(() =>
          createAxiosInstance(logger)
            .post(
              `${this.#accessTokenConfig.peEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
              querystring.stringify({
                grant_type: "client_credentials",
                client_id: this.#accessTokenConfig.clientId,
                client_secret: this.#accessTokenConfig.clientSecret,
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
              logger.error(error, "Raw error getting access token");
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

    if (this.#isDev) {
      return {
        status: 200,
      };
    }

    return this.#postPoleEmploiConvention(poleEmploiConvention)
      .then((response): PoleEmploiBroadcastResponse => {
        logger.info({
          _title: "PeBroadcast",
          status: "success",
          httpStatus: response.status,
          peConvention: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
        });

        return {
          status: response.status,
          ...([200, 201].includes(response.status)
            ? {}
            : {
                subscriberErrorFeedback: {
                  message: "Unsupported response status",
                  response,
                },
              }),
        };
      })
      .catch((err): PoleEmploiBroadcastResponse => {
        const error = castError(err);
        if (!axios.isAxiosError(error)) {
          logger.error({
            _title: "PeBroadcast",
            status: "notAxiosError",
            error,
            peConvention: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });

          notifyDiscord(
            `HttpPoleEmploiGateway notAxiosError ${
              poleEmploiConvention.originalId
            }: ${JSON.stringify(error)}`,
          );

          return {
            status: 500,
            subscriberErrorFeedback: {
              message: `not an axios error ${error.message}`,
            },
          };
        }

        if (!error.response) {
          logger.error({
            _title: "PeBroadcast",
            status: "noResponseInAxiosError",
            error,
            peConvention: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });

          notifyDiscord(
            `HttpPoleEmploiGateway noResponseInAxiosError ${
              poleEmploiConvention.originalId
            }: ${JSON.stringify(error)}`,
          );

          return {
            status: 500,
            subscriberErrorFeedback: {
              message: error.message,
              response: error,
            },
          };
        }

        const message = !error.response.data?.message
          ? "missing message"
          : JSON.stringify(error.response.data?.message);

        if (error.response.status === 404) {
          logger.error({
            _title: "PeBroadcast",
            status: "notFoundOrMismatch",
            httpStatus: error.response.status,
            message,
            peConvention: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });
          return {
            status: 404,
            subscriberErrorFeedback: {
              message,
              response: error.response,
            },
          };
        }

        const errorObject = {
          _title: "PeBroadcast",
          status: "unknownAxiosError",
          httpStatus: error.response.status,
          message: error.message,
          axiosBody: error.response.data as unknown,
          peConvention: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
          detailledError: error.toJSON(),
        };
        logger.error(errorObject);
        notifyObjectDiscord(errorObject);

        return {
          status: error.response.status,
          subscriberErrorFeedback: {
            response: error.response,
            message,
          },
        };
      });
  }

  async #postPoleEmploiConvention(poleEmploiConvention: PoleEmploiConvention) {
    const accessTokenResponse = await this.getAccessToken(
      `echangespmsmp api_${this.#peTestPrefix}immersion-prov2`,
    );

    return this.#broadcastlimiter.schedule(() =>
      this.#httpClient.broadcastConvention({
        body: poleEmploiConvention,
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }),
    );
  }
}
