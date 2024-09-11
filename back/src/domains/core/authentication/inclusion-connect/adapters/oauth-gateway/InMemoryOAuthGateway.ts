import { AbsoluteUrl, WithIdToken, queryParamsAsString } from "shared";
import { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
  OAuthGatewayProvider,
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

  public async getLoginUrl(
    params: GetLoginUrlParams,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    const loginUri: Record<OAuthGatewayProvider, AbsoluteUrl> = {
      InclusionConnect: `${this.providerConfig.providerBaseUri}/login-inclusion-connect`,
      ProConnect: `${this.providerConfig.providerBaseUri}/login-pro-connect`,
    };
    return `${loginUri[provider]}?${queryParamsAsString(params)}`;
  }

  public async getAccessToken(
    _: GetAccessTokenParams,
    __: OAuthGatewayProvider,
  ): Promise<GetAccessTokenResult> {
    if (this.#getAccessTokenResult) return this.#getAccessTokenResult;
    throw new Error("No access token provided (in memory)");
  }

  public async getLogoutUrl(
    params: WithIdToken,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    const logoutUri: Record<OAuthGatewayProvider, AbsoluteUrl> = {
      InclusionConnect: `${this.providerConfig.providerBaseUri}/logout-inclusion-connect`,
      ProConnect: `${this.providerConfig.providerBaseUri}/logout-pro-connect`, // TODO
    };

    return `${logoutUri[provider]}?${queryParamsAsString({
      postLogoutRedirectUrl:
        this.providerConfig.immersionRedirectUri.afterLogout,
      clientId: this.providerConfig.clientId,
      idToken: params.idToken,
    })}`;
  }

  // for test purposes
  public setAccessTokenResponse(result: GetAccessTokenResult): void {
    this.#getAccessTokenResult = result;
  }

  #getAccessTokenResult: GetAccessTokenResult | undefined = undefined;
}
