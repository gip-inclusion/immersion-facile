import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AccessTokenConfig } from "../primary/appConfig";
import { GetAccessTokenResponse } from "../../domain/core/ports/AccessTokenGateway";
import { createAxiosInstance } from "../../utils/axiosUtils";
import { secondsToMilliseconds } from "date-fns";
import {
  PeConnectGateway,
  PeConnectOAuthGetTokenWithCodeGrantPayload,
  PeConnectOAuthGrantPayload,
  PeConnectUserInfo,
} from "../../domain/generic/peConnect/port/PeConnectGateway";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { createLogger } from "../../utils/logger";

const _logger = createLogger(__filename);

export class HttpPeConnectGateway implements PeConnectGateway {
  public constructor(private readonly config: AccessTokenConfig) {}

  public oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const getAuthorizationCodePayload: PeConnectOAuthGrantPayload = {
      response_type: "code",
      client_id: this.config.clientId,
      realm: "/individu",
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/api/pe-connect",
      ),
      scope: [
        `application_${this.config.clientId}`,
        "api_peconnect-individuv1",
        "openid",
        "profile",
        "email",
      ].join(" "),
    };

    return `https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize?${queryParamsAsString<PeConnectOAuthGrantPayload>(
      getAuthorizationCodePayload,
    )}`;
  }

  public async oAuthGetAccessTokenThroughAuthorizationCode(
    authorization_code: string,
  ): Promise<GetAccessTokenResponse> {
    const getAccessTokenPayload: PeConnectOAuthGetTokenWithCodeGrantPayload = {
      grant_type: "authorization_code",
      code: authorization_code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/api/pe-connect",
      ),
    };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const response = await createAxiosInstance(_logger).post(
      "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Findividu",
      queryParamsAsString<PeConnectOAuthGetTokenWithCodeGrantPayload>(
        getAccessTokenPayload,
      ),
      {
        headers,
        timeout: secondsToMilliseconds(10),
      },
    );

    return response.data;
  }

  public async getUserInfo(
    accessToken: GetAccessTokenResponse,
  ): Promise<PeConnectUserInfo> {
    const headers = {
      Authorization: `Bearer ${accessToken.access_token}`,
      "Content-Type": "application/json;charset=UTF-8",
    };

    const response = await createAxiosInstance().get(
      "https://api.emploi-store.fr/partenaire/peconnect-individu/v1/userinfo",
      {
        headers,
      },
    );

    return response.data;
  }
}
