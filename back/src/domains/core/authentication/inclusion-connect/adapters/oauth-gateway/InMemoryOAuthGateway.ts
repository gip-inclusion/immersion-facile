import { AbsoluteUrl, queryParamsAsString } from "shared";
import { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
  OAuthGatewayMode,
} from "../../port/OAuthGateway";

export const fakeInclusionConnectConfig: OAuthConfig = {
  clientId: "my-client-id",
  clientSecret: "my-correct-token",
  immersionRedirectUri: {
    afterLogin: "http://immersion-uri.com/afterlogin",
    afterLogout: "http://immersion-uri.com/afterlogout",
  },
  inclusionConnectBaseUri: "http://fake-inclusion-connect-uri.com",
  proConnectBaseUri: "http://fake-pro-connect-uri.com",
  scope: "my-scope",
};

export class InMemoryOAuthGateway implements OAuthGateway {
  constructor(private inclusionConnectConfig: OAuthConfig) {}

  public async getLoginUrl(
    params: GetLoginUrlParams,
    mode: OAuthGatewayMode,
  ): Promise<AbsoluteUrl> {
    const loginUri: Record<OAuthGatewayMode, AbsoluteUrl> = {
      InclusionConnect: `${this.inclusionConnectConfig.inclusionConnectBaseUri}/login`,
      ProConnect: `${this.inclusionConnectConfig.proConnectBaseUri}/login`, // TODO
    };
    return `${loginUri[mode]}?${queryParamsAsString(params)}`;
  }

  public async getAccessToken(
    _: GetAccessTokenParams,
    __: OAuthGatewayMode,
  ): Promise<GetAccessTokenResult> {
    if (this.#getAccessTokenResult) return this.#getAccessTokenResult;
    throw new Error("No access token provided (in memory)");
  }

  public async getLogoutUrl(mode: OAuthGatewayMode): Promise<AbsoluteUrl> {
    const logoutUri: Record<OAuthGatewayMode, AbsoluteUrl> = {
      InclusionConnect: `${this.inclusionConnectConfig.inclusionConnectBaseUri}/logout`,
      ProConnect: `${this.inclusionConnectConfig.proConnectBaseUri}/logout`, // TODO
    };

    return `${logoutUri[mode]}?${queryParamsAsString({
      postLogoutRedirectUrl:
        this.inclusionConnectConfig.immersionRedirectUri.afterLogout,
      clientId: this.inclusionConnectConfig.clientId,
    })}`;
  }

  // for test purposes
  public setAccessTokenResponse(result: GetAccessTokenResult): void {
    this.#getAccessTokenResult = result;
  }

  #getAccessTokenResult: GetAccessTokenResult | undefined = undefined;
}
