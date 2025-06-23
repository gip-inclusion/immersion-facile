import Bottleneck from "bottleneck";
import { HTTP_STATUS, errors, queryParamsAsString } from "shared";
import type { HttpClient } from "shared-routes";
import { ZodError } from "zod/v4";
import { UnhandledError } from "../../../../../../config/helpers/handleHttpJsonResponseError";
import { validateAndParseZodSchemaV2 } from "../../../../../../config/helpers/validateAndParseZodSchema";
import { isAxiosError } from "../../../../../../utils/axiosUtils";
import {
  type LoggerParamsWithMessage,
  type OpacifiedLogger,
  createLogger,
} from "../../../../../../utils/logger";
import { notifyErrorObjectToTeam } from "../../../../../../utils/notifyTeam";
import type { AccessTokenDto } from "../../dto/AccessToken.dto";
import type { FtConnectAdvisorDto } from "../../dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../../dto/FtConnectUserDto";
import { externalAccessTokenSchema } from "../../port/AccessToken.schema";
import type { FtConnectGateway } from "../../port/FtConnectGateway";
import type {
  ExternalFtConnectAdvisor,
  ExternalFtConnectUser,
  FtConnectHeaders,
  FtConnectOauthConfig,
} from "./ftConnectApi.dto";
import { ftConnectErrorStrategy } from "./ftConnectApi.error";
import {
  type FtConnectExternalRoutes,
  toAccessToken,
  toFtConnectAdvisorDto,
  toFtConnectUserDto,
} from "./ftConnectApi.routes";
import {
  externalFtConnectAdvisorsSchema,
  externalFtConnectUserSchema,
  externalFtConnectUserStatutSchema,
} from "./ftConnectApi.schema";

const logger = createLogger(__filename);

type CounterType =
  | "getUserStatutInfo"
  | "getAdvisorsInfo"
  | "getUserInfo"
  | "exchangeCodeForAccessToken";

const counterApiKind = "peConnect";
const makeFtConnectLogger = (
  logger: OpacifiedLogger,
  counterType: CounterType,
) => ({
  success: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.info({
      ...rest,
      franceTravailGatewayStatus: "success",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
  total: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.info({
      ...rest,
      franceTravailGatewayStatus: "total",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
  error: ({ message, ...rest }: LoggerParamsWithMessage) =>
    logger.error({
      ...rest,
      franceTravailGatewayStatus: "error",
      message: `${counterApiKind} - ${counterType} - ${message}`,
    }),
});

const getUserStatutInfoLogger = makeFtConnectLogger(
  logger,
  "getUserStatutInfo",
);

const getAdvisorsInfoLogger = makeFtConnectLogger(logger, "getAdvisorsInfo");

const getUserInfoLogger = makeFtConnectLogger(logger, "getUserInfo");

const exchangeCodeForAccessTokenLogger = makeFtConnectLogger(
  logger,
  "exchangeCodeForAccessToken",
);

const ftConnectMaxRequestsPerInterval = 1;
const rate_ms = 1250;

// TODO GERER LE RETRY POUR L'ENSEMBLE DES APPELS FT
export class HttpFtConnectGateway implements FtConnectGateway {
  // FT Connect limit rate at 1 call per 1.2s
  #limiter = new Bottleneck({
    reservoir: ftConnectMaxRequestsPerInterval,
    reservoirRefreshInterval: rate_ms, // number of ms
    reservoirRefreshAmount: ftConnectMaxRequestsPerInterval,
    maxConcurrent: 1,
    minTime: Math.ceil(rate_ms / ftConnectMaxRequestsPerInterval),
  });

  constructor(
    private httpClient: HttpClient<FtConnectExternalRoutes>,
    private configs: FtConnectOauthConfig,
  ) {}

  public async getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    const log = exchangeCodeForAccessTokenLogger;
    try {
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.exchangeCodeForAccessToken({
          body: queryParamsAsString({
            client_id: this.configs.franceTravailClientId,
            client_secret: this.configs.franceTravailClientSecret,
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
        log.error({
          sharedRouteResponse: response,
          message: "exchangeCodeForAccessToken - Response status is not 200.",
        });
        return undefined;
      }
      const externalAccessToken = validateAndParseZodSchemaV2({
        schemaName: "externalAccessTokenSchema",
        inputSchema: externalAccessTokenSchema,
        schemaParsingInput: response.body,
        logger,
      });
      log.success({});
      return toAccessToken(externalAccessToken);
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          log.error({ error });
        },
        (payload) => notifyTeamOnNotError(payload),
      );
      return manageFtConnectError(error, "exchangeCodeForAccessToken", {
        authorization: authorizationCode,
      });
    }
  }

  public async getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: FtConnectUserDto;
        advisors: FtConnectAdvisorDto[];
      }
    | undefined
  > {
    const headers: FtConnectHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken.value}`,
    };

    const externalFtUser = await this.#getUserInfo(headers);
    const isUserJobseeker = await this.#userIsJobseeker(
      headers,
      externalFtUser?.idIdentiteExterne,
    );

    return externalFtUser
      ? {
          user: toFtConnectUserDto({ ...externalFtUser, isUserJobseeker }),
          advisors: (isUserJobseeker
            ? await this.#getAdvisorsInfo(headers)
            : []
          ).map(toFtConnectAdvisorDto),
        }
      : undefined;
  }

  async #userIsJobseeker(
    headers: FtConnectHeaders,
    peExternalId: string | undefined,
  ): Promise<boolean> {
    const log = getUserStatutInfoLogger;
    try {
      log.total({ ftConnect: { peExternalId } });
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getUserStatutInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        log.error({
          sharedRouteResponse: response,
          ftConnect: { peExternalId },
          message: "getUserStatutInfo -Response status is not 200.",
        });
        return false;
      }
      const externalFtConnectStatut = validateAndParseZodSchemaV2({
        schemaName: "externalFtConnectUserStatutSchema",
        inputSchema: externalFtConnectUserStatutSchema,
        schemaParsingInput: response.body,
        logger,
      });
      const isJobSeeker = isJobSeekerFromStatus(
        externalFtConnectStatut.codeStatutIndividu,
      );
      log.success({ ftConnect: { peExternalId, isJobSeeker } });
      return isJobSeeker;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          log.error({ error });
        },
        (payload) => notifyTeamOnNotError(payload),
      );
      return error instanceof ZodError
        ? false
        : manageFtConnectError(error, "getUserStatutInfo", {
            authorization: headers.Authorization,
          });
    }
  }

  async #getUserInfo(
    headers: FtConnectHeaders,
  ): Promise<ExternalFtConnectUser | undefined> {
    const log = getUserInfoLogger;
    try {
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getUserInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        log.error({
          sharedRouteResponse: response,
          message: "getUserInfo -Response status is not 200.",
        });
        return undefined;
      }
      const externalFtConnectUser = validateAndParseZodSchemaV2({
        schemaName: "externalFtConnectUserSchema",
        inputSchema: externalFtConnectUserSchema,
        schemaParsingInput: response.body,
        logger,
      });
      log.success({});
      return externalFtConnectUser;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          log.error({ error });
        },
        (payload) => notifyTeamOnNotError(payload),
      );
      if (error instanceof ZodError) return undefined;
      return manageFtConnectError(error, "getUserInfo", {
        authorization: headers.Authorization,
      });
    }
  }

  async #getAdvisorsInfo(
    headers: FtConnectHeaders,
  ): Promise<ExternalFtConnectAdvisor[]> {
    const log = getAdvisorsInfoLogger;
    try {
      log.total({});
      const response = await this.#limiter.schedule(() =>
        this.httpClient.getAdvisorsInfo({
          headers,
        }),
      );
      if (response.status !== 200) {
        log.error({
          sharedRouteResponse: response,
          message: "getAdvisorsInfo - Response status is not 200.",
        });
        return [];
      }
      const externalFtConnectAdvisors = validateAndParseZodSchemaV2({
        schemaName: "externalFtConnectAdvisorsSchema",
        inputSchema: externalFtConnectAdvisorsSchema,
        schemaParsingInput: response.body,
        logger,
      });
      log.success({});
      return externalFtConnectAdvisors;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          log.error({ error });
        },
        (payload) => notifyTeamOnNotError(payload),
      );
      if (error instanceof ZodError) return [];
      if (isJobseekerButNoAdvisorsResponse(error)) {
        notifyErrorObjectToTeam({
          message: `isJobseekerButNoAdvisorsResponse for token: ${headers.Authorization}`,
          error,
        });
        return [];
      }
      return manageFtConnectError(error, "getAdvisorsInfo", {
        authorization: headers.Authorization,
      });
    }
  }
}

const manageFtConnectError = (
  error: unknown,
  routeName: keyof FtConnectExternalRoutes,
  context: Record<string, string>,
): never => {
  if (!(error instanceof Error))
    throw new UnhandledError(
      `Is not an error: ${JSON.stringify(error)}`,
      errors.generic.notAnError(),
    );
  if (isAxiosError(error)) {
    logger.error({
      message: `FT CONNECT ERROR - ${routeName}`,
      error,
    });
    const handledError = ftConnectErrorStrategy(error, routeName).get(true);
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

const notifyTeamOnNotError = (payload: unknown): void =>
  notifyErrorObjectToTeam({
    message: "Should have been an error.",
    payload,
  });

const isJobSeekerFromStatus = (codeStatutIndividu: "0" | "1"): boolean =>
  codeStatutIndividu === "1";

/** Should not occur if FT apis respect contract => a jobseeker OAuth should have advisors */
const isJobseekerButNoAdvisorsResponse = (error: unknown) =>
  isAxiosError(error) &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;
