import querystring from "querystring";
import { AccessTokenConfig } from "../primary/appConfig";
import { GetAccessTokenResponse } from "../../domain/core/ports/AccessTokenGateway";
import { createAxiosInstance } from "../../utils/axiosUtils";
import { secondsToMilliseconds } from "date-fns";
import {
  PeConnectGateway,
  PeConnectUserInfo,
} from "../../domain/generic/peConnect/port/PeConnectGateway";

export class HttpPeConnectGateway implements PeConnectGateway {
  public constructor(private readonly config: AccessTokenConfig) {}

  public oAuthGetAuthorizationCodeRedirectUrl(): string {
    const payload = {
      client_id: this.config.clientId,
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/api/pe-connect",
      ),
      response_type: "code",
      scope: encodeURI(
        [
          `application_${this.config.clientId}`,
          "api_peconnect-individuv1",
          "openid",
          "profile",
          "email",
        ].join(" "),
      ),
    };

    return `https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize?realm=%2Findividu&response_type=${payload.response_type}&client_id=${payload.client_id}&redirect_uri=${payload.redirect_uri}&scope=${payload.scope}`;
  }

  public async oAuthGetAccessTokenThroughAuthorizationCode(
    authorization_code: string,
  ): Promise<GetAccessTokenResponse> {
    const dataAccessToken = querystring.stringify({
      grant_type: "authorization_code",
      code: authorization_code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/api/pe-connect",
      ),
    });
    const headers = {
      ContentType: "application/x-www-form-urlencoded",
    };

    const response = await createAxiosInstance().post(
      "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Findividu",
      dataAccessToken,
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
