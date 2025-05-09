import querystring from "node:querystring";
import Bottleneck from "bottleneck";
import { type AbsoluteUrl, type ConventionId, errors } from "shared";
import type { HttpClient, HttpResponse } from "shared-routes";
import type {
  AccessTokenResponse,
  FTAccessTokenConfig,
} from "../../../../config/bootstrap/appConfig";
import {
  type LoggerParamsWithMessage,
  createLogger,
} from "../../../../utils/logger";
import { notifyErrorObjectToTeam } from "../../../../utils/notifyTeam";
import type { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import {
  type RetryStrategy,
  RetryableError,
} from "../../../core/retry-strategy/ports/RetryStrategy";
import type {
  FranceTravailBroadcastResponse,
  FranceTravailConvention,
  FranceTravailGateway,
} from "../../ports/FranceTravailGateway";
import {
  type FrancetTravailRoutes,
  getFtTestPrefix,
} from "./FrancetTravailRoutes";

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

  readonly #accessTokenConfig: FTAccessTokenConfig;

  readonly #retryStrategy: RetryStrategy;

  constructor(
    httpClient: HttpClient<FrancetTravailRoutes>,
    caching: InMemoryCachingGateway<AccessTokenResponse>,
    ftApiUrl: AbsoluteUrl,
    accessTokenConfig: FTAccessTokenConfig,
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
        this.#commonlimiter.schedule(async () => {
          const response = await this.#httpClient.getAccessToken({
            body: querystring.stringify({
              grant_type: "client_credentials",
              client_id: this.#accessTokenConfig.clientId,
              client_secret: this.#accessTokenConfig.clientSecret,
              scope,
            }),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          if (response.status === 200) return response.body;

          const ftAccessTokenRelated = "FranceTravailGateway.getAccessToken";

          if (response.body.error.includes("invalid_client"))
            throw errors.partner.failure({
              serviceName: ftAccessTokenRelated,
              message: "Client authentication failed",
            });

          if (response.body.error.includes("invalid_grant"))
            throw errors.partner.failure({
              serviceName: ftAccessTokenRelated,
              message:
                "The provided access grant is invalid, expired, or revoked.",
            });

          if (response.body.error.includes("invalid_scope"))
            throw errors.partner.failure({
              serviceName: ftAccessTokenRelated,
              message: "Invalid scope",
            });

          const error = new Error(JSON.stringify(response.body, null, 2));

          if (isRetryable(response)) throw new RetryableError(error);

          throw error;
        }),
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

    const conventionParams: HandleConventionParams = {
      conventionId: ftConvention.originalId,
      ftConventionId: ftConvention.id,
    };

    return this.#postFranceTravailConvention(ftConvention)
      .then(handleFtResponse(conventionParams))
      .catch(handleError(conventionParams));
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

type HandleConventionParams = {
  conventionId: ConventionId;
  ftConventionId?: string;
};

type BroadcastConventionHttpResponse = Awaited<
  ReturnType<HttpClient<FrancetTravailRoutes>["broadcastConvention"]>
>;

const handleFtResponse =
  ({ conventionId, ftConventionId }: HandleConventionParams) =>
  (
    response: BroadcastConventionHttpResponse,
  ): FranceTravailBroadcastResponse => {
    if (response.status === 400 || response.status === 404) {
      logger.error({
        message: "FtBroadcast - handled error",
        franceTravailGatewayStatus: "error",
        error: new Error(JSON.stringify(response.body, null, 2)),
        ftConnect: {
          ftId: ftConventionId,
          originalId: conventionId,
        },
      });
      return {
        status: response.status,
        subscriberErrorFeedback: { message: response.body.message },
        body: response.body,
      };
    }

    if ([200, 201, 204].includes(response.status)) {
      logger.info({
        message: "FtBroadcast",
        franceTravailGatewayStatus: "success",
        sharedRouteResponse: response,
        ftConnect: {
          ftId: ftConventionId,
          originalId: conventionId,
        },
      });

      return {
        status: response.status,
        body: response.body,
      };
    }

    const errorObject: LoggerParamsWithMessage = {
      message: "FtBroadcast - unhandled status",
      franceTravailGatewayStatus: "error",
      error: new Error(JSON.stringify(response.body, null, 2)),
      ftConnect: {
        ftId: ftConventionId,
        originalId: conventionId,
      },
    };

    logger.error(errorObject);
    notifyErrorObjectToTeam(errorObject);

    return {
      status: response.status ?? 500,
      subscriberErrorFeedback: {
        message: JSON.stringify(response.body, null, 2),
      },
      body: response.body,
    };
  };

const handleError =
  ({ conventionId, ftConventionId }: HandleConventionParams) =>
  (error: any): FranceTravailBroadcastResponse => {
    const errorObject: LoggerParamsWithMessage = {
      message: `FtBroadcast - unexpected error - ${error?.message}`,
      franceTravailGatewayStatus: "error",
      error,
      ftConnect: {
        ftId: ftConventionId,
        originalId: conventionId,
      },
    };

    logger.error(errorObject);
    notifyErrorObjectToTeam(errorObject);

    return {
      status: 500,
      subscriberErrorFeedback: {
        message: error.message,
        error,
      },
      body: undefined,
    };
  };

const isRetryable = (httpResponse: HttpResponse<number, unknown>) => {
  return httpResponse.status === 429 || httpResponse.status === 503;
};
