import { secondsToMilliseconds } from "date-fns";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { stringToMd5 } from "shared/src/tokens/MagicLinkPayload";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import {
  AccessTokenDto,
  ExternalAccessToken,
  toAccessToken,
} from "../../domain/peConnect/dto/AccessToken.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  PeConnectAdvisorDto,
  ExternalPeConnectOAuthGetTokenWithCodeGrantPayload,
  ExternalPeConnectOAuthGrantPayload,
  PeConnectUserDto,
  PeUserAndAdvisors,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "../../domain/peConnect/dto/PeConnect.dto";
import { externalAccessTokenSchema } from "../../domain/peConnect/port/AccessToken.schema";
import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
} from "../../domain/peConnect/port/PeConnect.schema";
import { PeConnectGateway } from "../../domain/peConnect/port/PeConnectGateway";
import {
  createAxiosInstance,
  PrettyAxiosResponseError,
} from "../../utils/axiosUtils";
import type { AxiosInstance } from "axios";
import { createLogger } from "../../utils/logger";
import { AccessTokenConfig } from "../primary/config/appConfig";
import { validateAndParseZodSchema } from "../primary/helpers/httpErrors";
import { ManagedRedirectError } from "../primary/helpers/redirectErrors";

const logger = createLogger(__filename);

export class HttpPeConnectGateway implements PeConnectGateway {
  private ApiPeConnectUrls: ReturnType<typeof makeApiPeConnectUrls>;
  private axiosInstance: AxiosInstance;

  public constructor(
    private readonly config: AccessTokenConfig, // private readonly retryStrategy: RetryStrategy,
  ) {
    this.axiosInstance = createAxiosInstance(logger);
    this.ApiPeConnectUrls = makeApiPeConnectUrls({
      peAuthCandidatUrl: config.peAuthCandidatUrl,
      immersionBaseUrl: config.immersionFacileBaseUrl,
      peApiUrl: config.peApiUrl,
    });
  }

  public oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const authorizationCodePayload: ExternalPeConnectOAuthGrantPayload = {
      response_type: "code",
      client_id: this.config.clientId,
      realm: "/individu",
      redirect_uri: this.ApiPeConnectUrls.REGISTERED_REDIRECT_URL,
      scope: peConnectNeededScopes(this.config.clientId),
    };

    return `${
      this.ApiPeConnectUrls.OAUTH2_AUTH_CODE_STEP_1
    }?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
      authorizationCodePayload,
    )}`;
  }

  private async oAuthGetAccessTokenThroughAuthorizationCode(
    authorizationCode: string,
  ): Promise<AccessTokenDto> {
    const getAccessTokenPayload: ExternalPeConnectOAuthGetTokenWithCodeGrantPayload =
      {
        grant_type: "authorization_code",
        code: authorizationCode,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.ApiPeConnectUrls.REGISTERED_REDIRECT_URL,
      };

    const response = await createAxiosInstance(logger)
      .post(
        this.ApiPeConnectUrls.OAUTH2_ACCESS_TOKEN_STEP_2,
        queryParamsAsString<ExternalPeConnectOAuthGetTokenWithCodeGrantPayload>(
          getAccessTokenPayload,
        ),
        {
          headers: headersUrlEncoded(),
          timeout: secondsToMilliseconds(10),
        },
      )
      .catch((error: any) => {
        logger.error(
          {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
          },
          "oAuthGetAccessTokenThroughAuthorizationCode Error",
        );
        if (isInvalidGrantError(error))
          throw new ManagedRedirectError("peConnectInvalidGrant", error);

        throw PrettyAxiosResponseError(
          "PeConnect Get Access Token Failure",
          error,
        );
      });

    const externalAccessToken: ExternalAccessToken = validateAndParseZodSchema(
      externalAccessTokenSchema,
      response.data,
    );

    const accessToken = toAccessToken(externalAccessToken);
    const trackId = stringToMd5(accessToken.value);
    logger.info({ trackId }, "PeConnect Get Access Token Success");

    return toAccessToken(externalAccessToken);
  }

  private async getUserInfo(
    accessToken: AccessTokenDto,
  ): Promise<PeConnectUserDto> {
    const trackId = stringToMd5(accessToken.value);
    const response = await this.axiosInstance
      .get(this.ApiPeConnectUrls.PECONNECT_USER_INFO, {
        headers: headersWithAuthPeAccessToken(accessToken),
      })
      .catch((error) => {
        logger.error({ trackId, error }, "GetUserInfo PE Error");

        if (!error || error.status === undefined)
          throw new ManagedRedirectError("peConnectNoValidUser", error);

        throw PrettyAxiosResponseError(
          "PeConnect Get User Info Failure",
          error,
        );
      });

    const body = response.data;

    logger.info({ trackId, body }, "GetUserInfo PE Response");

    const bodyFromPeFixed = body === "" ? [] : body; // this is because PE does not respect their own contracts and sends "" instead of []

    const externalUser: ExternalPeConnectUser = validateAndParseZodSchema(
      externalPeConnectUserSchema,
      bodyFromPeFixed,
    );

    return toPeConnectUserDto(externalUser);
  }

  private async getAdvisorsInfo(
    accessToken: AccessTokenDto,
  ): Promise<PeConnectAdvisorDto[]> {
    const trackId = stringToMd5(accessToken.value);
    const response = await createAxiosInstance()
      .get(this.ApiPeConnectUrls.PECONNECT_ADVISORS_INFO, {
        headers: headersWithAuthPeAccessToken(accessToken),
        timeout: secondsToMilliseconds(10),
      })
      .catch((error) => {
        logger.error({ trackId, error }, "GetAdvisorsInfo PE Error");
        if (!error || error.status === undefined)
          throw new ManagedRedirectError("peConnectNoValidAdvisor", error);

        throw PrettyAxiosResponseError(
          "PeConnect Get Advisor Info Failure",
          error,
        );
      });

    logger.info(
      { trackId, body: response.data },
      "GetAdvisorsInfo PE Response",
    );

    const advisors: ExternalPeConnectAdvisor[] = validateAndParseZodSchema(
      externalPeConnectAdvisorsSchema,
      response.data,
    );

    return advisors.map(toPeConnectAdvisorDto);
  }

  public async getUserAndAdvisors(
    authorizationCode: string,
  ): Promise<PeUserAndAdvisors> {
    const accessToken: AccessTokenDto =
      await this.oAuthGetAccessTokenThroughAuthorizationCode(authorizationCode);
    const [user, advisors] = await Promise.all([
      this.getUserInfo(accessToken),
      this.getAdvisorsInfo(accessToken),
    ]);

    return {
      user,
      advisors,
    };
  }
}

type PeConnectUrlTargets =
  | "OAUTH2_AUTH_CODE_STEP_1"
  | "OAUTH2_ACCESS_TOKEN_STEP_2"
  | "REGISTERED_REDIRECT_URL"
  | "PECONNECT_USER_INFO"
  | "PECONNECT_ADVISORS_INFO";

const makeApiPeConnectUrls = (params: {
  peAuthCandidatUrl: AbsoluteUrl;
  peApiUrl: AbsoluteUrl;
  immersionBaseUrl: AbsoluteUrl;
}): Record<PeConnectUrlTargets, AbsoluteUrl> => ({
  OAUTH2_AUTH_CODE_STEP_1: `${params.peAuthCandidatUrl}/connexion/oauth2/authorize`,
  OAUTH2_ACCESS_TOKEN_STEP_2: `${params.peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
  REGISTERED_REDIRECT_URL: `${params.immersionBaseUrl}/api/pe-connect`,
  PECONNECT_USER_INFO: `${params.peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
  PECONNECT_ADVISORS_INFO: `${params.peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
});

const peConnectNeededScopes = (clientId: string): string =>
  [
    `application_${clientId}`,
    "api_peconnect-individuv1",
    "api_peconnect-conseillersv1",
    "individu",
    "openid",
    "profile",
    "email",
  ].join(" ");

const headersWithAuthPeAccessToken = (
  accessToken: AccessTokenDto,
): { [key: string]: string } => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${accessToken.value}`,
});

const headersUrlEncoded = (): { [key: string]: string } => ({
  "Content-Type": "application/x-www-form-urlencoded",
});

const isInvalidGrantError = (error: any): boolean =>
  error?.response?.status === "400" &&
  error?.response?.data?.error === "invalid_grant";
