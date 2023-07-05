import axios from "axios";
import { Logger } from "pino";
import { ZodError } from "zod";
import {
  HTTP_STATUS,
  parseZodSchemaAndLogErrorOnParsingFailure,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "http-client";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { externalAccessTokenSchema } from "../../../domain/peConnect/port/AccessToken.schema";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import {
  CounterType,
  exchangeCodeForAccessTokenCounter,
  getAdvisorsInfoCounter,
  getUserInfoCounter,
  getUserStatutInfoCounter,
} from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { UnhandledError } from "../../primary/helpers/unhandledError";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  PeConnectHeaders,
  PeConnectOauthConfig,
} from "./peConnectApi.dto";
import { peConnectErrorStrategy as peConnectAxiosErrorStrategy } from "./peConnectApi.error";
import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
  externalPeConnectUserStatutSchema,
} from "./peConnectApi.schema";
import {
  PeConnectExternalTargets,
  toAccessToken,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./peConnectApi.targets";

const logger = createLogger(__filename);

const counterApiKind = "peConnect";
const makePeConnectLogger = (logger: Logger, counterType: CounterType) => ({
  success: (contents: object) =>
    logger.info({
      ...contents,
      status: "success",
      api: counterApiKind,
      counterType,
    }),
  total: (contents: object) =>
    logger.info({
      ...contents,
      status: "total",
      api: counterApiKind,
      counterType,
    }),
  error: (contents: object) =>
    logger.error({
      ...contents,
      status: "error",
      api: counterApiKind,
      counterType,
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

export class HttpPeConnectGateway implements PeConnectGateway {
  constructor(
    private httpClient: HttpClient<PeConnectExternalTargets>,
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
      const response = await this.httpClient.exchangeCodeForAccessToken({
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
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, errorKind: "Response status is not 200." });
        return undefined;
      }
      const externalAccessToken = parseZodSchemaAndLogErrorOnParsingFailure(
        externalAccessTokenSchema,
        response.responseBody,
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
          log.error({ errorType: error.message });
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

    const externalPeUser = await this.getUserInfo(headers);
    const isUserJobseeker = await this.userIsJobseeker(
      headers,
      externalPeUser && externalPeUser.idIdentiteExterne,
    );

    return externalPeUser
      ? {
          user: toPeConnectUserDto({ ...externalPeUser, isUserJobseeker }),
          advisors: (isUserJobseeker
            ? await this.getAdvisorsInfo(headers)
            : []
          ).map(toPeConnectAdvisorDto),
        }
      : undefined;
  }

  private async getUserInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectUser | undefined> {
    const counter = getUserInfoCounter;
    const log = getUserInfoLogger;
    try {
      counter.total.inc();
      log.total({});
      const response = await this.httpClient.getUserInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, errorKind: "Response status is not 200." });
        return undefined;
      }
      const externalPeConnectUser = parseZodSchemaAndLogErrorOnParsingFailure(
        externalPeConnectUserSchema,
        response.responseBody,
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
          log.error({ errorType: error.message });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return undefined;
      return managePeConnectError(error, "getUserInfo", {
        authorization: headers.Authorization,
      });
    }
  }

  private async userIsJobseeker(
    headers: PeConnectHeaders,
    peExternalId: string | undefined,
  ): Promise<boolean> {
    const counter = getUserStatutInfoCounter;
    const log = getUserStatutInfoLogger;
    try {
      counter.total.inc();
      log.total({ peExternalId });
      const response = await this.httpClient.getUserStatutInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({
          response,
          peExternalId,
          errorKind: "Response status is not 200.",
        });
        return false;
      }
      const externalPeConnectStatut = parseZodSchemaAndLogErrorOnParsingFailure(
        externalPeConnectUserStatutSchema,
        response.responseBody,
        logger,
        {
          token: headers.Authorization,
        },
      );
      const isJobSeeker = isJobSeekerFromStatus(
        externalPeConnectStatut.codeStatutIndividu,
      );
      counter.success.inc();
      log.success({ peExternalId, isJobSeeker });
      return isJobSeeker;
    } catch (error) {
      errorChecker(
        error,
        (error) => {
          counter.error.inc({ errorType: error.message });
          log.error({ errorType: error.message });
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

  private async getAdvisorsInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectAdvisor[]> {
    const counter = getAdvisorsInfoCounter;
    const log = getAdvisorsInfoLogger;
    try {
      counter.total.inc();
      log.total({});
      const response = await this.httpClient.getAdvisorsInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        log.error({ response, errorKind: "Response status is not 200." });
        return [];
      }
      const externalPeConnectAdvisors =
        parseZodSchemaAndLogErrorOnParsingFailure(
          externalPeConnectAdvisorsSchema,
          response.responseBody,
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
          log.error({ errorType: error.message });
        },
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return [];
      // TODO TODO TODO A RETRAVAILLER AVEC LE RETRY
      // pour que managed error retourne une valeur
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
  targetKind: keyof PeConnectExternalTargets,
  context: Record<string, string>,
): never => {
  if (!(error instanceof Error))
    throw new UnhandledError(
      `Is not an error: ${JSON.stringify(error)}`,
      new Error("Not an error class"),
    );
  if (axios.isAxiosError(error)) {
    logger.error(
      {
        targetKind,
        context,
        message: error?.message,
        body: error?.response?.data,
      },
      "PE CONNECT ERROR",
    );
    const handledError = peConnectAxiosErrorStrategy(error, targetKind).get(
      true,
    );
    if (handledError) throw handledError;
    throw new UnhandledError("Erreur axios non gérée", error);
  }
  throw new UnhandledError(
    `Non axios error - ${
      error.message
    } - targetKind: ${targetKind} - context: ${JSON.stringify(context)}`,
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
