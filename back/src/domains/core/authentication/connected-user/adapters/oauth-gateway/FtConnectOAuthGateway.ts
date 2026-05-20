import { type AbsoluteUrl, queryParamsAsString } from "shared";
import type { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import type { ExternalFtConnectOAuthGrantPayload } from "../../../ft-connect/adapters/ft-connect-gateway/ftConnectApi.dto";
import type {
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";

export class FtConnectOAuthGateway implements OAuthGateway {
  constructor(private readonly ftConnectConfig: OAuthConfig) {}

  public async getLoginUrl({
    nonce,
    state,
  }: GetLoginUrlParams): Promise<AbsoluteUrl> {
    const queryParams = queryParamsAsString<ExternalFtConnectOAuthGrantPayload>(
      {
        response_type: "code",
        client_id: this.ftConnectConfig.clientId,
        realm: "/individu",
        redirect_uri: this.ftConnectConfig.immersionRedirectUri.afterLogin,
        scope: this.ftConnectConfig.scope,
        state,
        nonce,
      },
    );

    return `${this.ftConnectConfig.providerBaseUri}/connexion/oauth2/authorize?${queryParams}`;
  }

  public async getAccessToken(): Promise<GetAccessTokenResult> {
    throw new Error(
      "FtConnectOAuthGateway.getAccessToken is not supported: FT Connect access tokens are handled by FtConnectGateway.",
    );
  }

  public async getLogoutUrl(): Promise<AbsoluteUrl> {
    throw new Error(
      "FtConnectOAuthGateway.getLogoutUrl is not supported: FT Connect does not expose a logout URL.",
    );
  }
}
