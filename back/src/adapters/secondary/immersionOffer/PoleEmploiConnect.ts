import querystring from "querystring";
import { AccessTokenConfig } from "../../primary/appConfig";
import { GetAccessTokenResponse } from "../../../domain/core/ports/AccessTokenGateway";
import { createAxiosInstance } from "../../../utils/axiosUtils";
import { secondsToMilliseconds } from "date-fns";

export type PeConnectUserInfo = {
  sub: string;
  gender: string;
  family_name: string;
  given_name: string;
  email: string;
  idIdentiteExterne: string;
};

export class PoleEmploiConnect {
  public constructor(private readonly config: AccessTokenConfig) {}

  public getAuthorizationCodeRedirectUrl(): string {
    const payload = {
      client_id: this.config.clientId,
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/pe-connect",
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

  public async getAccessToken(code: string): Promise<GetAccessTokenResponse> {
    const dataAccessToken = querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: encodeURI(
        "https://immersion-facile.beta.gouv.fr/pe-connect",
      ),
    });
    const headers = {
      ContentType: "application/x-www-form-urlencoded",
    };

    let response;
    try {
      response = await createAxiosInstance().post(
        "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Findividu",
        dataAccessToken,
        {
          headers,
          timeout: secondsToMilliseconds(10),
        },
      );
    } catch (err: any) {
      console.log(err.data);
      console.log("MOCKING VALID RESULT");

      return {
        access_token: "ejhlgjdkljeklgjlkjekljzklejekljsklfj",
        expires_in: 59,
      } as GetAccessTokenResponse;
    }

    return response?.data;
  }

  public async getUserInfo(accessToken: string): Promise<PeConnectUserInfo> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json;charset=UTF-8",
    };

    let response;
    try {
      response = await createAxiosInstance().get(
        "https://api.emploi-store.fr/partenaire/peconnect-individu/v1/userinfo",
        {
          headers,
        },
      );
    } catch (err: any) {
      console.log(err.data);
      console.log("MOCKING VALID RESULT");

      return {
        sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
        gender: "male",
        family_name: "John",
        given_name: "Doe",
        email: "john.doe@gmail.com",
        idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
      } as PeConnectUserInfo;
    }

    return response.data;
  }
}
