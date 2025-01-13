import querystring from "querystring";
import axios, { AxiosError, AxiosResponse } from "axios";
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
  FranceTravailBroadcastResponse,
  FranceTravailConvention,
  FranceTravailGateway,
} from "../../ports/FranceTravailGateway";
import { FrancetTravailRoutes, getFtTestPrefix } from "./FrancetTravailRoutes";

const logger = createLogger(__filename);

const franceTravailCommonMaxRequestsPerInterval = 1;
const franceTravailBroadcastMaxRequestPerInterval = 3;
const rate_ms = 1250;

export class HttpFranceTravailGateway implements FranceTravailGateway {
  // Common limiter with 1 call every 1.2s
  #commonlimiter = new Bottleneck({
    reservoir: franceTravailCommonMaxRequestsPerInterval,
    reservoirRefreshInterval: rate_ms,
    reservoirRefreshAmount: franceTravailCommonMaxRequestsPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / franceTravailCommonMaxRequestsPerInterval),
  });

  // convention broacast limiter with 3 calls every 1.2s
  #broadcastlimiter = new Bottleneck({
    reservoir: franceTravailBroadcastMaxRequestPerInterval,
    reservoirRefreshInterval: rate_ms,
    reservoirRefreshAmount: franceTravailBroadcastMaxRequestPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / franceTravailBroadcastMaxRequestPerInterval),
  });

  #ftTestPrefix: "test" | "";
  #isDev: boolean;

  readonly #httpClient: HttpClient<FrancetTravailRoutes>;

  readonly #caching: InMemoryCachingGateway<AccessTokenResponse>;

  readonly #accessTokenConfig: AccessTokenConfig;

  readonly #retryStrategy: RetryStrategy;

  constructor(
    httpClient: HttpClient<FrancetTravailRoutes>,
    caching: InMemoryCachingGateway<AccessTokenResponse>,
    ftApiUrl: AbsoluteUrl,
    accessTokenConfig: AccessTokenConfig,
    retryStrategy: RetryStrategy,
    isDev = false,
  ) {
    this.#ftTestPrefix = getFtTestPrefix(ftApiUrl);
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
              `${this.#accessTokenConfig.ftEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
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
    ftConvention: FranceTravailConvention,
  ): Promise<FranceTravailBroadcastResponse> {
    logger.info({
      message: "FtBroadcast",
      franceTravailGatewayStatus: "total",
      ftConnect: {
        ftId: ftConvention.id,
        originalId: ftConvention.originalId,
      },
    });

    if (this.#isDev) {
      return {
        status: 200,
        body: { success: true },
      };
    }

    return this.#postFranceTravailConvention(ftConvention)
      .then((response): FranceTravailBroadcastResponse => {
        logger.info({
          message: "FtBroadcast",
          franceTravailGatewayStatus: "success",
          sharedRouteResponse: response,
          ftConnect: {
            ftId: ftConvention.id,
            originalId: ftConvention.originalId,
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
      .catch((err): FranceTravailBroadcastResponse => {
        const error = castError(err);
        if (!axios.isAxiosError(error)) {
          logger.error({
            message: "FtBroadcast - notAxiosError",
            franceTravailGatewayStatus: "error",
            error,
            ftConnect: {
              ftId: ftConvention.id,
              originalId: ftConvention.originalId,
            },
          });

          notifyDiscord(
            `HttpFranceTravailGateway notAxiosError ${
              ftConvention.originalId
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
            message: "FtBroadcast - noResponseInAxiosError",
            franceTravailGatewayStatus: "error",
            error,
            ftConnect: {
              ftId: ftConvention.id,
              originalId: ftConvention.originalId,
            },
          });

          notifyDiscord(
            `HttpFranceTravailGateway noResponseInAxiosError ${
              ftConvention.originalId
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

        const axiosResponse = stripAxiosResponse(error);

        if (error.response.status === 404) {
          logger.error({
            message: `FtBroadcast - notFoundOrMismatch - ${message}`,
            franceTravailGatewayStatus: "error",
            axiosResponse,
            ftConnect: {
              ftId: ftConvention.id,
              originalId: ftConvention.originalId,
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
          message: "FtBroadcast",
          franceTravailGatewayStatus: "error",
          error,
          axiosResponse,
          ftConnect: {
            ftId: ftConvention.id,
            originalId: ftConvention.originalId,
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

  async #postFranceTravailConvention(ftConvention: FranceTravailConvention) {
    const accessTokenResponse = await this.getAccessToken(
      `echangespmsmp api_${this.#ftTestPrefix}immersion-prov2`,
    );

    return this.#broadcastlimiter.schedule(() =>
      this.#httpClient.broadcastConvention({
        body: ftConvention,
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }),
    );
  }
}

const stripAxiosResponse = (
  error: AxiosError,
): Partial<Pick<AxiosResponse, "status" | "headers" | "data">> => ({
  status: error.response?.status,
  headers: error.response?.headers,
  data: error.response?.data,
});
