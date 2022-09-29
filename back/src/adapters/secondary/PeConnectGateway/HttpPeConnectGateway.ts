import { AxiosResponse } from "axios";
import {
  AbsoluteUrl,
  HttpResponse,
  ManagedAxios,
  queryParamsAsString,
  stringToMd5,
} from "shared";
import {
  AccessTokenDto,
  ExternalAccessToken,
  toAccessToken,
} from "../../../domain/peConnect/dto/AccessToken.dto";
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
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { externalAccessTokenSchema } from "../../../domain/peConnect/port/AccessToken.schema";
import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
} from "../../../domain/peConnect/port/PeConnect.schema";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import { createLogger } from "../../../utils/logger";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export type PeConnectUrlTargets =
  | "OAUTH2_AUTH_CODE_STEP_1"
  | "OAUTH2_ACCESS_TOKEN_STEP_2"
  | "REGISTERED_REDIRECT_URL"
  | "PECONNECT_USER_INFO"
  | "PECONNECT_ADVISORS_INFO";

export class HttpPeConnectGateway implements PeConnectGateway {
  public constructor(
    private readonly authConfig: {
      clientId: string;
      clientSecret: string;
    },
    private readonly httpClient: ManagedAxios<PeConnectUrlTargets>,
  ) {}

  public oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const authorizationCodePayload: ExternalPeConnectOAuthGrantPayload = {
      response_type: "code",
      client_id: this.authConfig.clientId,
      realm: "/individu",
      redirect_uri: this.httpClient.targetsUrls.REGISTERED_REDIRECT_URL(),
      scope: peConnectNeededScopes(this.authConfig.clientId),
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
        client_id: this.authConfig.clientId,
        client_secret: this.authConfig.clientSecret,
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
    const response: HttpResponse = await this.httpClient.get({
      target: this.httpClient.targetsUrls.PECONNECT_USER_INFO,
      adapterConfig: {
        headers: peConnectheadersWithBearerAuthToken(accessToken),
      },
    });

    const externalUser: ExternalPeConnectUser = validateAndParseZodSchema(
      externalPeConnectUserSchema,
      extractUserInfoBodyFromResponse(response),
    );

    return toPeConnectUserDto(externalUser);
  }

  private async getAdvisorsInfo(
    accessToken: AccessTokenDto,
  ): Promise<PeConnectAdvisorDto[]> {
    const response: AxiosResponse = await this.httpClient.get({
      target: this.httpClient.targetsUrls.PECONNECT_ADVISORS_INFO,
      adapterConfig: {
        headers: peConnectheadersWithBearerAuthToken(accessToken),
      },
    });

    const advisors: ExternalPeConnectAdvisor[] = validateAndParseZodSchema(
      externalPeConnectAdvisorsSchema,
      extractAdvisorsBodyFromResponse(response),
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
}

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

export const peConnectheadersWithBearerAuthToken = (
  accessToken: AccessTokenDto,
): { [key: string]: string } => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${accessToken.value}`,
});

const headersUrlEncoded = (): { [key: string]: string } => ({
  "Content-Type": "application/x-www-form-urlencoded",
});

const extractUserInfoBodyFromResponse = (
  response: AxiosResponse,
): {
  [key: string]: any;
} => {
  const body = response.data;

  return body === "" ? {} : body;
};

const extractAdvisorsBodyFromResponse = (
  response: AxiosResponse,
): {
  [key: string]: any;
} => {
  const body = response.data;

  return body === "" ? [] : body;
};
