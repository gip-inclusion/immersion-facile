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
import {
  ErrorMapper,
  HttpResponse,
  TargetUrlsMapper,
} from "shared/src/httpClient/httpClient";
import { ManagedRedirectError } from "../primary/helpers/redirectErrors";
import { ManagedAxios } from "shared/src/httpClient/adapters/axios.adapter";

const logger = createLogger(__filename);

export type HttpPeConnectGatewayConfig = {
  peAuthCandidatUrl: AbsoluteUrl;
  immersionFacileBaseUrl: AbsoluteUrl;
  peApiUrl: AbsoluteUrl;
  clientId: string;
  clientSecret: string;
};

export class HttpPeConnectGateway implements PeConnectGateway {
  public constructor(
    private readonly config: HttpPeConnectGatewayConfig,
    private readonly httpClient: ManagedAxios<PeConnectUrlTargets>,
  ) {}

  public oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const authorizationCodePayload: ExternalPeConnectOAuthGrantPayload = {
      response_type: "code",
      client_id: this.config.clientId,
      realm: "/individu",
      redirect_uri: this.httpClient.targetsUrls.REGISTERED_REDIRECT_URL(),
      scope: peConnectNeededScopes(this.config.clientId),
    };

    return `${this.httpClient.targetsUrls.OAUTH2_AUTH_CODE_STEP_1()}?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
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
        redirect_uri: this.httpClient.targetsUrls.REGISTERED_REDIRECT_URL(),
      };

    const response: HttpResponse = await this.httpClient.post({
      target: this.httpClient.targetsUrls.OAUTH2_ACCESS_TOKEN_STEP_2,
      data: queryParamsAsString<ExternalPeConnectOAuthGetTokenWithCodeGrantPayload>(
        getAccessTokenPayload,
      ),
      adapterConfig: {
        headers: headersUrlEncoded(),
      },
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
    //const trackId = stringToMd5(accessToken.value);
    const response: HttpResponse = await this.httpClient.get({
      target: this.httpClient.targetsUrls.PECONNECT_USER_INFO,
      adapterConfig: {
        headers: headersWithAuthPeAccessToken(accessToken),
      },
    });

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

    const response: AxiosResponse = await this.httpClient.get({
      target: this.httpClient.targetsUrls.PECONNECT_ADVISORS_INFO,
      adapterConfig: {
        headers: headersWithAuthPeAccessToken(accessToken),
      },
    });

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

export const httpPeConnectGatewayTargetMapperMaker = (
  config: HttpPeConnectGatewayConfig,
): TargetUrlsMapper<PeConnectUrlTargets> => ({
  OAUTH2_AUTH_CODE_STEP_1: (): AbsoluteUrl =>
    `${config.peAuthCandidatUrl}/connexion/oauth2/authorize/`,
  OAUTH2_ACCESS_TOKEN_STEP_2: () =>
    `${config.peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
  REGISTERED_REDIRECT_URL: () =>
    `${config.immersionFacileBaseUrl}/api/pe-connect`,
  PECONNECT_USER_INFO: () =>
    `${config.peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
  PECONNECT_ADVISORS_INFO: () =>
    `${config.peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
});

export type PeConnectUrlTargets =
  | "OAUTH2_AUTH_CODE_STEP_1"
  | "OAUTH2_ACCESS_TOKEN_STEP_2"
  | "REGISTERED_REDIRECT_URL"
  | "PECONNECT_USER_INFO"
  | "PECONNECT_ADVISORS_INFO";

export const errorMapper: ErrorMapper<PeConnectUrlTargets> = {
  PECONNECT_ADVISORS_INFO: {
    HttpClientForbiddenError: (error) =>
      new ManagedRedirectError("peConnectAdvisorForbiddenAccess", error),
  },
  OAUTH2_ACCESS_TOKEN_STEP_2: {
    HttpClientBadError: (error) =>
      new ManagedRedirectError("peConnectInvalidGrant", error),
  },
};

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
