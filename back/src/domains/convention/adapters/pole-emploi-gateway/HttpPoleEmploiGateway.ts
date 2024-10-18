import querystring from "querystring";
import axios from "axios";
import Bottleneck from "bottleneck";
import { secondsToMilliseconds } from "date-fns";
import { AbsoluteUrl, castError } from "shared";
import { HttpClient } from "shared-routes";
import {
  AccessTokenConfig,
  AccessTokenResponse,
} from "../../../../config/bootstrap/appConfig";
import {
  createAxiosInstance,
  isRetryableError,
} from "../../../../utils/axiosUtils";
import {
  LoggerParamsWithMessage,
  createLogger,
} from "../../../../utils/logger";
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

  readonly #caching: InMemoryCachingGateway<AccessTokenResponse>;

  readonly #accessTokenConfig: AccessTokenConfig;

  readonly #retryStrategy: RetryStrategy;

  constructor(
    httpClient: HttpClient<PoleEmploiRoutes>,
    caching: InMemoryCachingGateway<AccessTokenResponse>,
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

  public async getAccessToken(scope: string): Promise<AccessTokenResponse> {
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
              logger.error({
                error,
                message: "Raw error getting access token",
              });
              if (isRetryableError(logger, error))
                throw new RetryableError(error);
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
      message: "PeBroadcast",
      franceTravailGatewayStatus: "total",
      peConnect: {
        peId: poleEmploiConvention.id,
        originalId: poleEmploiConvention.originalId,
      },
    });

    if (this.#isDev) {
      return {
        status: 200,
        body: { success: true },
      };
    }

    return this.#postPoleEmploiConvention(poleEmploiConvention)
      .then((response): PoleEmploiBroadcastResponse => {
        logger.info({
          message: "PeBroadcast",
          franceTravailGatewayStatus: "success",
          sharedRouteResponse: response,
          peConnect: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
        });

        if ([200, 201, 204].includes(response.status))
          return {
            status: response.status,
            body: response.body,
          };

        throw new Error(
          `Unsupported response status ${
            response.status
          } with body '${JSON.stringify(response.body)}'`,
        );
      })
      .catch((err): PoleEmploiBroadcastResponse => {
        const error = castError(err);
        if (!axios.isAxiosError(error)) {
          logger.error({
            message: "PeBroadcast - notAxiosError",
            franceTravailGatewayStatus: "error",
            error,
            peConnect: {
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
              message: `Not an axios error: ${error.message}`,
              error,
            },
            body: undefined,
          };
        }

        if (!error.response) {
          logger.error({
            message: "PeBroadcast - noResponseInAxiosError",
            franceTravailGatewayStatus: "error",
            error,
            peConnect: {
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
              error,
            },
            body: undefined,
          };
        }

        const message = !error.response.data?.message
          ? "missing message"
          : JSON.stringify(error.response.data?.message);

        if (error.response.status === 404) {
          logger.error({
            message: `PeBroadcast - notFoundOrMismatch - ${message}`,
            franceTravailGatewayStatus: "error",
            axiosResponse: error.response,
            peConnect: {
              peId: poleEmploiConvention.id,
              originalId: poleEmploiConvention.originalId,
            },
          });
          return {
            status: 404,
            subscriberErrorFeedback: {
              message,
              error,
            },
            body: error.response.data,
          };
        }

        const errorObject: LoggerParamsWithMessage = {
          message: "PeBroadcast",
          franceTravailGatewayStatus: "error",
          error,
          axiosResponse: error.response,
          peConnect: {
            peId: poleEmploiConvention.id,
            originalId: poleEmploiConvention.originalId,
          },
        };
        logger.error(errorObject);
        notifyObjectDiscord(errorObject);

        return {
          status: error.response.status,
          subscriberErrorFeedback: {
            error,
            message,
          },
          body: error.response.data,
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
