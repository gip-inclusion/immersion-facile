import { type AbsoluteUrl, queryParamsAsString } from "shared";
import type { AppConfig } from "../../../../../../config/bootstrap/appConfig";
import { ftConnectNeededScopesForAllUsedApi } from "../../../ft-connect/adapters/ft-connect-gateway/ftConnectApi.routes";
import type {
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";

type FtConnectLoginUrlParams = {
  response_type: "code";
  client_id: string;
  realm: string;
  redirect_uri: AbsoluteUrl;
  scope: string;
  state: string;
  nonce: string;
};

export class FtConnectOAuthGateway implements OAuthGateway {
  constructor(private readonly appConfig: AppConfig) {}

  public async getLoginUrl({
    nonce,
    state,
  }: GetLoginUrlParams): Promise<AbsoluteUrl> {
    const queryParams = queryParamsAsString<FtConnectLoginUrlParams>({
      response_type: "code",
      client_id: this.appConfig.franceTravailClientId,
      realm: "/individu",
      redirect_uri: `${this.appConfig.immersionFacileBaseUrl}/api/pe-connect`,
      scope: ftConnectNeededScopesForAllUsedApi(
        this.appConfig.franceTravailClientId,
      ),
      state,
      nonce,
    });

    return `${this.appConfig.ftAuthCandidatUrl}/connexion/oauth2/authorize?${queryParams}`;
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
