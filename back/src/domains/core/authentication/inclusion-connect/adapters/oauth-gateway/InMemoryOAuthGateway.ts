import { AbsoluteUrl, queryParamsAsString } from "shared";
import { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  GetLogoutUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";

export const fakeProviderConfig: OAuthConfig = {
  clientId: "my-client-id",
  clientSecret: "my-correct-token",
  immersionRedirectUri: {
    afterLogin: "http://immersion-uri.com/afterlogin",
    afterLogout: "http://immersion-uri.com/afterlogout",
  },
  providerBaseUri: "http://fake-provider-uri.com",
  scope: "my-scope",
};

export class InMemoryOAuthGateway implements OAuthGateway {
  constructor(private providerConfig: OAuthConfig) {}

  public async getLoginUrl(params: GetLoginUrlParams): Promise<AbsoluteUrl> {
    return `${
      this.providerConfig.providerBaseUri
    }/login-pro-connect?${queryParamsAsString(params)}`;
  }

  public async getAccessToken(
    _: GetAccessTokenParams,
  ): Promise<GetAccessTokenResult> {
    if (this.#getAccessTokenResult) return this.#getAccessTokenResult;
    throw new Error("No access token provided (in memory)");
  }

  public async getLogoutUrl(params: GetLogoutUrlParams): Promise<AbsoluteUrl> {
    return `${
      this.providerConfig.providerBaseUri
    }/logout-pro-connect?${queryParamsAsString({
      postLogoutRedirectUrl:
        this.providerConfig.immersionRedirectUri.afterLogout,
      idToken: params.idToken,
      state: params.state,
    })}`;
  }

  // for test purposes
  public setAccessTokenResponse(result: GetAccessTokenResult): void {
    this.#getAccessTokenResult = result;
  }

  #getAccessTokenResult: GetAccessTokenResult | undefined = undefined;
}
