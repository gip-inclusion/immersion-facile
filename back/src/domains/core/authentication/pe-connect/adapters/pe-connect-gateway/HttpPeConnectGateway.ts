import axios from "axios";
import Bottleneck from "bottleneck";
import { HTTP_STATUS, queryParamsAsString } from "shared";
import { HttpClient } from "shared-routes";
import { ZodError } from "zod";
import { UnhandledError } from "../../../../../../config/helpers/handleHttpJsonResponseError";
import {
  CounterType,
  exchangeCodeForAccessTokenCounter,
  getAdvisorsInfoCounter,
  getUserInfoCounter,
  getUserStatutInfoCounter,
} from "../../../../../../utils/counters";
import {
  LoggerParamsWithMessage,
  OpacifiedLogger,
  createLogger,
} from "../../../../../../utils/logger";
import { notifyObjectDiscord } from "../../../../../../utils/notifyDiscord";
import { parseZodSchemaAndLogErrorOnParsingFailure } from "../../../../../../utils/schema.utils";
import { AccessTokenDto } from "../../dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../dto/PeConnectUser.dto";
import { externalAccessTokenSchema } from "../../port/AccessToken.schema";
import { PeConnectGateway } from "../../port/PeConnectGateway";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  PeConnectHeaders,
  PeConnectOauthConfig,
} from "./peConnectApi.dto";
import { peConnectErrorStrategy as peConnectAxiosErrorStrategy } from "./peConnectApi.error";
import {
  PeConnectExternalRoutes,
  toAccessToken,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./peConnectApi.routes";
import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
  externalPeConnectUserStatutSchema,
} from "./peConnectApi.schema";

const logger = createLogger(__filename);

const counterApiKind = "peConnect";
const makePeConnectLogger = (
  logger: OpacifiedLogger,
  counterType: CounterType,
) => ({
  success: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.info({
      ...rest,
      status: "success",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
  total: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.info({
      ...rest,
      status: "total",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
  error: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.error({
      ...rest,
      status: "error",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
});

const getUserStatutInfoLogger = makePeConnectLogger(
  logger,
  "getUserStatutInfo",
);

const getAdvisorsInfoLogger = makePeConnectLogger(logger, "getAdvisorsInfo");

const getUserInfoLogger = makePeConnectLogger(logger, "getUserInfo");

const exchangeCodeForAccessTokenLogger = makePeConnectLogger(
  logger,
  "exchangeCodeForAccessToken",
);

const peConnectMaxRequestsPerInterval = 1;
const rate_ms = 1250;

// TODO GERER LE RETRY POUR L'ENSEMBLE DES APPELS PE
export class HttpPeConnectGateway implements PeConnectGateway {
  // PE Connect limit rate at 1 call per 1.2s
  #limiter = new Bottleneck({
    reservoir: peConnectMaxRequestsPerInterval,
    reservoirRefreshInterval: rate_ms, // number of ms
    reservoirRefreshAmount: peConnectMaxRequestsPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / peConnectMaxRequestsPerInterval),
  });

  constructor(
    private httpClient: HttpClient<PeConnectExternalRoutes>,
    private configs: PeConnectOauthConfig,
  ) {}

  public async getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    const counter = exchangeCodeForAccessTokenCounter;
    const log = exchangeCodeForAccessTokenLogger;
    try {
      counter.total.inc();
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.exchangeCodeForAccessToken({
          body: queryParamsAsString({
            client_id: this.configs.poleEmploiClientId,
            client_secret: this.configs.poleEmploiClientSecret,
            code: authorizationCode,
            grant_type: "authorization_code",
            redirect_uri: `${this.configs.immersionFacileBaseUrl}/api/pe-connect`,
          }),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
      );
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, message: "Response status is not 200." });
        return undefined;
      }
      const externalAccessToken = parseZodSchemaAndLogErrorOnParsingFailure(
        externalAccessTokenSchema,
        response.body,
        logger,
        {
          token: authorizationCode,
        },
      );
      counter.success.inc();
      log.success({});
      return toAccessToken(externalAccessToken);
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          counter.error.inc({
            errorType: error.message,
          });
          log.error({ error });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      return managePeConnectError(error, "exchangeCodeForAccessToken", {
        authorization: authorizationCode,
      });
    }
  }

  public async getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: PeConnectUserDto;
        advisors: PeConnectAdvisorDto[];
      }
    | undefined
  > {
    const headers: PeConnectHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken.value}`,
    };

    const externalPeUser = await this.#getUserInfo(headers);
    const isUserJobseeker = await this.#userIsJobseeker(
      headers,
      externalPeUser?.idIdentiteExterne,
    );

    return externalPeUser
      ? {
          user: toPeConnectUserDto({ ...externalPeUser, isUserJobseeker }),
          advisors: (isUserJobseeker
            ? await this.#getAdvisorsInfo(headers)
            : []
          ).map(toPeConnectAdvisorDto),
        }
      : undefined;
  }

  async #userIsJobseeker(
    headers: PeConnectHeaders,
    peExternalId: string | undefined,
  ): Promise<boolean> {
    const counter = getUserStatutInfoCounter;
    const log = getUserStatutInfoLogger;
    try {
      counter.total.inc();
      log.total({ peConnect: { peExternalId } });
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getUserStatutInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({
          response,
          peConnect: { peExternalId },
          message: "Response status is not 200.",
        });
        return false;
      }
      const externalPeConnectStatut = parseZodSchemaAndLogErrorOnParsingFailure(
        externalPeConnectUserStatutSchema,
        response.body,
        logger,
        {
          token: headers.Authorization,
        },
      );
      const isJobSeeker = isJobSeekerFromStatus(
        externalPeConnectStatut.codeStatutIndividu,
      );
      counter.success.inc();
      log.success({ peConnect: { peExternalId, isJobSeeker } });
      return isJobSeeker;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          counter.error.inc({ errorType: error.message });
          log.error({ error });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      return error instanceof ZodError
        ? false
        : managePeConnectError(error, "getUserStatutInfo", {
            authorization: headers.Authorization,
          });
    }
  }

  async #getUserInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectUser | undefined> {
    const counter = getUserInfoCounter;
    const log = getUserInfoLogger;
    try {
      counter.total.inc();
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getUserInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, message: "Response status is not 200." });
        return undefined;
      }
      const externalPeConnectUser = parseZodSchemaAndLogErrorOnParsingFailure(
        externalPeConnectUserSchema,
        response.body,
        logger,
        {
          token: headers.Authorization,
        },
      );
      counter.success.inc();
      log.success({});
      return externalPeConnectUser;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          counter.error.inc({ errorType: error.message });
          log.error({ error });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return undefined;
      return managePeConnectError(error, "getUserInfo", {
        authorization: headers.Authorization,
      });
    }
  }

  async #getAdvisorsInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectAdvisor[]> {
    const counter = getAdvisorsInfoCounter;
    const log = getAdvisorsInfoLogger;
    try {
      counter.total.inc();
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getAdvisorsInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, message: "Response status is not 200." });
        return [];
      }
      const externalPeConnectAdvisors =
        parseZodSchemaAndLogErrorOnParsingFailure(
          externalPeConnectAdvisorsSchema,
          response.body,
          logger,
          {
            token: headers.Authorization,
          },
        );
      counter.success.inc();
      log.success({});
      return externalPeConnectAdvisors;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          counter.error.inc({ errorType: error.message });
          log.error({ error });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return [];
      if (isJobseekerButNoAdvisorsResponse(error)) {
        notifyObjectDiscord({
          message: `isJobseekerButNoAdvisorsResponse for token: ${headers.Authorization}`,
          error,
        });
        return [];
      }
      return managePeConnectError(error, "getAdvisorsInfo", {
        authorization: headers.Authorization,
      });
    }
  }
}

const managePeConnectError = (
  error: unknown,
  routeName: keyof PeConnectExternalRoutes,
  context: Record<string, string>,
): never => {
  if (!(error instanceof Error))
    throw new UnhandledError(
      `Is not an error: ${JSON.stringify(error)}`,
      new Error("Not an error class"),
    );
  if (axios.isAxiosError(error)) {
    logger.error({
      context,
      message: `PE CONNECT ERROR - ${routeName}`,
      error,
    });
    const handledError = peConnectAxiosErrorStrategy(error, routeName).get(
      true,
    );
    if (handledError) throw handledError;
    throw new UnhandledError("Erreur axios non gérée", error);
  }
  throw new UnhandledError(
    `Non axios error - ${
      error.message
    } - routeName: ${routeName} - context: ${JSON.stringify(context)}`,
    error,
  );
};

const errorChecker = (
  error: unknown,
  cbOnError: (error: Error) => void,
  cbOnNotError: (stuff: unknown) => void,
): void => (error instanceof Error ? cbOnError(error) : cbOnNotError(error));

const notifyDiscordOnNotError = (payload: unknown): void =>
  notifyObjectDiscord({
    message: "Should have been an error.",
    payload,
  });

const isJobSeekerFromStatus = (codeStatutIndividu: "0" | "1"): boolean =>
  codeStatutIndividu === "1";

/** Should not occur if PE apis respect contract => a jobseeker OAuth should have advisors */
const isJobseekerButNoAdvisorsResponse = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;
