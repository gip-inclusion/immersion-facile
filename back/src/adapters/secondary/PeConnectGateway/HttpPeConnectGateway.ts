import axios from "axios";
import { HttpClient } from "http-client";
import { HTTP_STATUS } from "shared";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { externalAccessTokenSchema } from "../../../domain/peConnect/port/AccessToken.schema";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";
import { UnhandledError } from "../../primary/helpers/unhandledError";
import {
  toAccessToken,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./Httpgateway.mapper";
import { toAccessTokenHttpRequestConfig } from "./peConnectApi.client";
import {
  PeConnectTargets,
  PeConnectOauthConfig,
  ExternalAccessToken,
  PeConnectHeaders,
  ExternalPeConnectUser,
  ExternalPeConnectAdvisor,
  PeConnectTargetsKind,
} from "./peConnectApi.dto";
import {
  externalPeConnectUserSchema,
  externalPeConnectUserStatutSchema,
  externalPeConnectAdvisorsSchema,
} from "./peConnectApi.schema";

import {
  exchangeCodeForAccessTokenCounter,
  getAdvisorsInfoCounter,
  getUserInfoCounter,
  getUserStatutInfoCounter,
} from "./peConnectApi.counter";
import { peConnectErrorStrategy } from "./peConnectApi.error";

export class HttpPeConnectGateway implements PeConnectGateway {
  constructor(
    private httpClient: HttpClient<PeConnectTargets>,
    private configs: PeConnectOauthConfig,
  ) {}

  public async getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto> {
    const timerFlag = `${authorizationCode} - PeConnect getAccessToken duration`;
    const counter = exchangeCodeForAccessTokenCounter;
    try {
      counter.total.inc();
      const result = await this.httpClient.exchangeCodeForAccessToken(
        toAccessTokenHttpRequestConfig(authorizationCode, this.configs),
      );
      const externalAccessToken: ExternalAccessToken =
        validateAndParseZodSchema(
          externalAccessTokenSchema,
          result.responseBody,
        );

      counter.success.inc();
      //const accessToken = toAccessToken(externalAccessToken);
      //const trackId = stringToMd5(accessToken.value);
      //logger.info({ trackId }, "PeConnect Get Access Token Success");
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
      this.manageError(error, "exchangeCodeForAccessToken");
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }

  public async getUserAndAdvisors(accessToken: AccessTokenDto): Promise<{
    user: PeConnectUserDto;
    advisors: PeConnectAdvisorDto[];
  }> {
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

    return {
      user: toPeConnectUserDto({ ...externalPeUser, isUserJobseeker }),
      advisors: externalPeConnectAdvisors.map(toPeConnectAdvisorDto),
    };
  }

  private async getUserInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectUser> {
    const timerFlag = `${headers.Authorization} - PeConnect getUserInfo duration`;
    const counter = getUserInfoCounter;
    try {
      // eslint-disable-next-line no-console
      console.time(timerFlag);
      counter.total.inc();
      const getUserInfoResponse = await this.httpClient.getUserInfo({
        headers,
      });
      const externalPeConnectUser = externalPeConnectUserSchema.parse(
        getUserInfoResponse.responseBody,
      );
      counter.success.inc();
      return externalPeConnectUser;
    } catch (error) {
      errorChecker(
        error,
        (error) => counter.error.inc({ errorType: error.message }),
        (payload) => notifyDiscordOnNotError(payload),
      );
      this.manageError(error, "getUserInfo");
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }

  private async userIsJobseeker(headers: PeConnectHeaders): Promise<boolean> {
    const timerFlag = `${headers.Authorization} - PeConnect userIsJobseeker duration`;
    const counter = getUserStatutInfoCounter;
    try {
      counter.total.inc();
      const getUserInfoResponse = await this.httpClient.getUserStatutInfo({
        headers,
      });
      const externalPeConnectStatut = externalPeConnectUserStatutSchema.parse(
        getUserInfoResponse.responseBody,
      );
      counter.success.inc();
      return isJobSeekerFromStatus(externalPeConnectStatut.codeStatutIndividu);
    } catch (error) {
      errorChecker(
        error,
        (error) => counter.error.inc({ errorType: error.message }),
        (payload) => notifyDiscordOnNotError(payload),
      );
      this.manageError(error, "getUserStatutInfo");
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(timerFlag);
    }
  }

  private async getAdvisorsInfo(
    headers: PeConnectHeaders,
  ): Promise<ExternalPeConnectAdvisor[]> {
    const timerFlag = `${headers.Authorization} - PeConnect getAdvisorsInfo duration`;
    getAdvisorsInfoCounter.total.inc();
    return this.httpClient
      .getAdvisorsInfo({
        headers,
      })
      .then((response) => {
        const externalPeConnectAdvisor = externalPeConnectAdvisorsSchema.parse(
          response.responseBody,
        );
        getAdvisorsInfoCounter.success.inc();
        return externalPeConnectAdvisor;
      })
      .catch((error) => {
        errorChecker(
          error,
          (error) =>
            getAdvisorsInfoCounter.error.inc({ errorType: error.message }),
          (payload) => notifyDiscordOnNotError(payload),
        );
        // TODO TODO TODO A RETRAVAILLER AVEC LE RETRY
        // pour que managed error retourne une valeur
        if (isJobseekerButNoAdvisorsResponse(error)) {
          notifyObjectDiscord({
            message: "isJobseekerButNoAdvisorsResponse - Should not occur",
            error,
          });
          return Promise.resolve([]);
        }
        this.manageError(error, "getAdvisorsInfo");
      })
      .finally(() => {
        // eslint-disable-next-line no-console
        console.timeEnd(timerFlag);
      });
  }

  private manageError(error: unknown, context: PeConnectTargetsKind): never {
    if (!(error instanceof Error))
      throw new UnhandledError(
        `Is not an error: ${JSON.stringify(error)}`,
        new Error("Not an error class"),
      );

    if (!axios.isAxiosError(error))
      throw new UnhandledError(`Non axios error - ${error.message}`, error);

    const handledError = peConnectErrorStrategy(error, context).get(true);
    if (handledError) throw handledError;

    // eslint-disable-next-line no-console
    console.log("UNHANDLED AXIOS ERROR", error.toJSON());
    throw new UnhandledError("Erreur axios non gérée", error);
  }
}

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

/** Should not occur if PE apis respect contract => a jobseeker user should have advisors */
const isJobseekerButNoAdvisorsResponse = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;
