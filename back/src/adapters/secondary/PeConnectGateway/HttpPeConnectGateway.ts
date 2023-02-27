import axios from "axios";
import { HttpClient } from "http-client";
import {
  HTTP_STATUS,
  parseZodSchemaAndLogErrorOnParsingFailure,
  queryParamsAsString,
} from "shared";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { externalAccessTokenSchema } from "../../../domain/peConnect/port/AccessToken.schema";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { UnhandledError } from "../../primary/helpers/unhandledError";
import {
  toAccessToken,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./peConnectApi.client";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  PeConnectHeaders,
  PeConnectOauthConfig,
  PeConnectTargets,
  PeConnectTargetsKind,
} from "./peConnectApi.dto";
import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
  externalPeConnectUserStatutSchema,
} from "./peConnectApi.schema";

import { ZodError } from "zod";
import { createLogger } from "../../../utils/logger";
import {
  exchangeCodeForAccessTokenCounter,
  getAdvisorsInfoCounter,
  getUserInfoCounter,
  getUserStatutInfoCounter,
} from "./peConnectApi.counter";
import { peConnectErrorStrategy as peConnectAxiosErrorStrategy } from "./peConnectApi.error";

const logger = createLogger(__filename);
export class HttpPeConnectGateway implements PeConnectGateway {
  constructor(
    private httpClient: HttpClient<PeConnectTargets>,
    private configs: PeConnectOauthConfig,
  ) {}

  public async getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    const timerFlag = `${authorizationCode} - PeConnect getAccessToken duration`;
    // eslint-disable-next-line no-console
    console.time(timerFlag);
    const counter = exchangeCodeForAccessTokenCounter;
    try {
      counter.total.inc();
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
        logger.error(response, "getAccessToken - Response status is not 200.");
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
      return toAccessToken(externalAccessToken);
    } catch (error) {
      errorChecker(
        error,
        (error) =>
          counter.error.inc({
            errorType: error.message,
          }),
        (payload) => notifyDiscordOnNotError(payload),
      );
      return managePeConnectError(error, "exchangeCodeForAccessToken", {
        authorization: authorizationCode,
      });
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
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
    const isUserJobseeker = await this.userIsJobseeker(headers);
    const [externalPeUser, externalPeConnectAdvisors] = await Promise.all([
      this.getUserInfo(headers),
      isUserJobseeker ? this.getAdvisorsInfo(headers) : [],
    ]);
    return externalPeUser
      ? {
          user: toPeConnectUserDto({ ...externalPeUser, isUserJobseeker }),
          advisors: externalPeConnectAdvisors.map(toPeConnectAdvisorDto),
        }
      : undefined;
  }

  private async getUserInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectUser | undefined> {
    const timerFlag = `${headers.Authorization} - PeConnect getUserInfo duration`;
    // eslint-disable-next-line no-console
    console.time(timerFlag);
    const counter = getUserInfoCounter;
    try {
      counter.total.inc();
      const response = await this.httpClient.getUserInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        logger.error(response, "getUserInfo - Response status is not 200.");
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
      return externalPeConnectUser;
    } catch (error) {
      errorChecker(
        error,
        (error) => counter.error.inc({ errorType: error.message }),
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return undefined;
      return managePeConnectError(error, "getUserInfo", {
        authorization: headers.Authorization,
      });
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }

  private async userIsJobseeker(headers: PeConnectHeaders): Promise<boolean> {
    const timerFlag = `${headers.Authorization} - PeConnect userIsJobseeker duration`;
    // eslint-disable-next-line no-console
    console.time(timerFlag);
    const counter = getUserStatutInfoCounter;
    try {
      counter.total.inc();
      const response = await this.httpClient.getUserStatutInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        logger.error(response, "userIsJobseeker - Response status is not 200.");
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
      counter.success.inc();
      return isJobSeekerFromStatus(externalPeConnectStatut.codeStatutIndividu);
    } catch (error) {
      errorChecker(
        error,
        (error) => counter.error.inc({ errorType: error.message }),
        (payload) => notifyDiscordOnNotError(payload),
      );
      if (error instanceof ZodError) return false;
      return managePeConnectError(error, "getUserStatutInfo", {
        authorization: headers.Authorization,
      });
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }

  private async getAdvisorsInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectAdvisor[]> {
    const timerFlag = `${headers.Authorization} - PeConnect getAdvisorsInfo duration`;
    // eslint-disable-next-line no-console
    console.time(timerFlag);
    const counter = getAdvisorsInfoCounter;
    try {
      counter.total.inc();
      const response = await this.httpClient.getAdvisorsInfo({
        headers,
      });
      if (response.status !== 200) {
        counter.error.inc({
          errorType: `Bad response status code ${response.status}`,
        });
        logger.error(response, "getAdvisorsInfo - Response status is not 200.");
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
      return externalPeConnectAdvisors;
    } catch (error) {
      errorChecker(
        error,
        (error) => counter.error.inc({ errorType: error.message }),
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
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }
}

export const managePeConnectError = (
  error: unknown,
  targetKind: PeConnectTargetsKind,
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
