import { secondsToMilliseconds } from "date-fns";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import {
  AccessToken,
  ExternalAccessToken,
  externalAccessTokenSchema,
  ExternalPeConnectAdvisor,
  externalPeConnectAdvisorsSchema,
  ExternalPeConnectUser,
  externalPeConnectUserSchema,
  PeConnectAdvisorDTO,
  PeConnectGateway,
  PeConnectOAuthGetTokenWithCodeGrantPayload,
  PeConnectOAuthGrantPayload,
  PeConnectUserDTO,
  PeUserAndAdvisors,
  toAccessToken,
  toPeConnectAdvisorDTO,
  toPeConnectUserDTO,
} from "../../domain/peConnect/port/PeConnectGateway";
import {
  createAxiosInstance,
  PrettyAxiosResponseError,
} from "../../utils/axiosUtils";
import { createLogger } from "../../utils/logger";
import { AccessTokenConfig } from "../primary/config/appConfig";

const _logger = createLogger(__filename);

export class HttpPeConnectGateway implements PeConnectGateway {
  public constructor(private readonly config: AccessTokenConfig) {}

  public oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const authorizationCodePayload: PeConnectOAuthGrantPayload = {
      response_type: "code",
      client_id: this.config.clientId,
      realm: "/individu",
      redirect_uri: ApiPeConnectUrls.REGISTERED_REDIRECT_URL,
      scope: peConnectNeededScopes(this.config.clientId),
    };

    return `https://${
      ApiPeConnectUrls.OAUTH2_AUTH_CODE_STEP_1
    }?${queryParamsAsString<PeConnectOAuthGrantPayload>(
      authorizationCodePayload,
    )}`;
  }

  public async oAuthGetAccessTokenThroughAuthorizationCode(
    authorization_code: string,
  ): Promise<AccessToken> {
    const getAccessTokenPayload: PeConnectOAuthGetTokenWithCodeGrantPayload = {
      grant_type: "authorization_code",
      code: authorization_code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: ApiPeConnectUrls.REGISTERED_REDIRECT_URL,
    };

    const response = await createAxiosInstance(_logger)
      .post(
        ApiPeConnectUrls.OAUTH2_ACCESS_TOKEN_STEP_2,
        queryParamsAsString<PeConnectOAuthGetTokenWithCodeGrantPayload>(
          getAccessTokenPayload,
        ),
        {
          headers: headersUrlEncoded(),
          timeout: secondsToMilliseconds(10),
        },
      )
      .catch((error) => {
        throw PrettyAxiosResponseError("PeConnect Failure", error);
      });

    const externalAccessToken: ExternalAccessToken =
      externalAccessTokenSchema.parse(response.data);

    return toAccessToken(externalAccessToken);
  }

  public async getUserInfo(
    accessToken: AccessToken,
  ): Promise<PeConnectUserDTO> {
    const response = await createAxiosInstance()
      .get(ApiPeConnectUrls.PECONNECT_USER_INFO, {
        headers: headersWithAuthPeAccessToken(accessToken),
      })
      .catch((error) => {
        throw PrettyAxiosResponseError("PeConnect Failure", error);
      });

    const externalUser: ExternalPeConnectUser =
      externalPeConnectUserSchema.parse(response.data);

    return toPeConnectUserDTO(externalUser);
  }

  public async getAdvisorsInfo(
    accessToken: AccessToken,
  ): Promise<PeConnectAdvisorDTO[]> {
    const response = await createAxiosInstance()
      .get(ApiPeConnectUrls.PECONNECT_ADVISORS_INFO, {
        headers: headersWithAuthPeAccessToken(accessToken),
        timeout: secondsToMilliseconds(10),
      })
      .catch((error) => {
        throw PrettyAxiosResponseError("PeConnect Failure", error);
      });

    const advisors: ExternalPeConnectAdvisor[] =
      externalPeConnectAdvisorsSchema.parse(response.data);

    return advisors.map(toPeConnectAdvisorDTO);
  }

  public async getUserAndAdvisors(
    authorizationCode: string,
  ): Promise<PeUserAndAdvisors> {
    const accessToken: AccessToken =
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

const ApiPeConnectUrls: Record<PeConnectUrlTargets, AbsoluteUrl> = {
  OAUTH2_AUTH_CODE_STEP_1:
    "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize",
  OAUTH2_ACCESS_TOKEN_STEP_2:
    "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Findividu",
  REGISTERED_REDIRECT_URL:
    "https://immersion-facile.beta.gouv.fr/api/pe-connect",
  PECONNECT_USER_INFO:
    "https://api.emploi-store.fr/partenaire/peconnect-individu/v1/userinfo",
  PECONNECT_ADVISORS_INFO:
    "https://api.emploi-store.fr/partenaire/peconnect-conseillers/v1/contactspe/conseillers",
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
  accessToken: AccessToken,
): { [key: string]: string } => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${accessToken.value}`,
});

const headersUrlEncoded = (): { [key: string]: string } => ({
  "Content-Type": "application/x-www-form-urlencoded",
});
