import type { AxiosInstance } from "axios";
import { AxiosResponse } from "axios";
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
  ExternalPeConnectOAuthGetTokenWithCodeGrantPayload,
  ExternalPeConnectOAuthGrantPayload,
  ExternalPeConnectUser,
  PeConnectAdvisorDto,
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
import { createLogger } from "../../utils/logger";
import { validateAndParseZodSchema } from "../primary/helpers/httpErrors";

const logger = createLogger(__filename);

const AXIOS_TIMEOUT_FIVE_SECOND = 5000;

export type HttpPeConnectGatewayConfig = {
  peAuthCandidatUrl: AbsoluteUrl;
  immersionFacileBaseUrl: AbsoluteUrl;
  peApiUrl: AbsoluteUrl;
  clientId: string;
  clientSecret: string;
};

export class HttpPeConnectGateway implements PeConnectGateway {
  private apiPeConnectUrls: Record<PeConnectUrlTargets, AbsoluteUrl>;

  public constructor(
    private readonly config: HttpPeConnectGatewayConfig,
    private readonly httpClient: AxiosInstance,
  ) {
    // TODO Extract and inject
    this.apiPeConnectUrls = makeApiPeConnectUrls({
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
      redirect_uri: this.apiPeConnectUrls.REGISTERED_REDIRECT_URL,
      scope: peConnectNeededScopes(this.config.clientId),
    };

    return `${
      this.apiPeConnectUrls.OAUTH2_AUTH_CODE_STEP_1
    }?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
      authorizationCodePayload,
    )}`;
  }

  public async peAccessTokenThroughAuthorizationCode(
    authorizationCode: string,
  ): Promise<AccessTokenDto> {
    const getAccessTokenPayload: ExternalPeConnectOAuthGetTokenWithCodeGrantPayload =
      {
        grant_type: "authorization_code",
        code: authorizationCode,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.apiPeConnectUrls.REGISTERED_REDIRECT_URL,
      };

    const response: AxiosResponse = await this.httpClient.post(
      this.apiPeConnectUrls.OAUTH2_ACCESS_TOKEN_STEP_2,
      queryParamsAsString<ExternalPeConnectOAuthGetTokenWithCodeGrantPayload>(
        getAccessTokenPayload,
      ),
      {
        headers: headersUrlEncoded(),
        timeout: AXIOS_TIMEOUT_FIVE_SECOND,
      },
    );

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
    //const trackId = stringToMd5(accessToken.value);
    const response = await this.httpClient.get(
      this.apiPeConnectUrls.PECONNECT_USER_INFO,
      {
        headers: headersWithAuthPeAccessToken(accessToken),
        timeout: AXIOS_TIMEOUT_FIVE_SECOND,
      },
    );

    const body = this.extractUserInfoBodyFromResponse(response);

    const externalUser: ExternalPeConnectUser = validateAndParseZodSchema(
      externalPeConnectUserSchema,
      body,
    );

    return toPeConnectUserDto(externalUser);
  }

  private async getAdvisorsInfo(
    accessToken: AccessTokenDto,
  ): Promise<PeConnectAdvisorDto[]> {
    //const trackId = stringToMd5(accessToken.value);
    //return this.retryStrategy.apply(async () => {

    const response: AxiosResponse = await this.httpClient.get(
      this.apiPeConnectUrls.PECONNECT_ADVISORS_INFO,
      {
        headers: headersWithAuthPeAccessToken(accessToken),
        timeout: AXIOS_TIMEOUT_FIVE_SECOND,
      },
    );

    // Here

    const body = this.extractAdvisorsBodyFromResponse(response);

    const advisors: ExternalPeConnectAdvisor[] = validateAndParseZodSchema(
      externalPeConnectAdvisorsSchema,
      body,
    );

    return advisors.map(toPeConnectAdvisorDto);
  }

  public async getUserAndAdvisors(
    authorizationCode: string,
  ): Promise<PeUserAndAdvisors> {
    const accessToken: AccessTokenDto =
      await this.peAccessTokenThroughAuthorizationCode(authorizationCode);

    const [user, advisors] = await Promise.all([
      this.getUserInfo(accessToken),
      this.getAdvisorsInfo(accessToken),
    ]);

    return {
      user,
      advisors,
    };
  }

  private extractUserInfoBodyFromResponse(response: AxiosResponse): {
    [key: string]: any;
  } {
    const body = response.data;

    return body === "" ? {} : body;
  }

  private extractAdvisorsBodyFromResponse(response: AxiosResponse): {
    [key: string]: any;
  } {
    const body = response.data;

    return body === "" ? [] : body;
  }
}

export type PeConnectUrlTargets =
  | "OAUTH2_AUTH_CODE_STEP_1"
  | "OAUTH2_ACCESS_TOKEN_STEP_2"
  | "REGISTERED_REDIRECT_URL"
  | "PECONNECT_USER_INFO"
  | "PECONNECT_ADVISORS_INFO";

export const makeApiPeConnectUrls = (params: {
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

const getOAuthGetAccessTokenThroughAuthorizationCodeResponse = (
  axiosInstance: AxiosInstance,
  targetUrl: PeConnectUrlTargets,
  getAccessTokenPayload: ExternalPeConnectOAuthGetTokenWithCodeGrantPayload,
): Promise<AxiosResponse> =>
  axiosInstance.post(
    targetUrl,
    queryParamsAsString<ExternalPeConnectOAuthGetTokenWithCodeGrantPayload>(
      getAccessTokenPayload,
    ),
    {
      headers: headersUrlEncoded(),
      timeout: AXIOS_TIMEOUT_FIVE_SECOND,
    },
  );

const headersUrlEncoded = (): { [key: string]: string } => ({
  "Content-Type": "application/x-www-form-urlencoded",
});
