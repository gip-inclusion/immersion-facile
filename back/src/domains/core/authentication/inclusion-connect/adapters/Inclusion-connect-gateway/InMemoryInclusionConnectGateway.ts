import { AbsoluteUrl, queryParamsAsString } from "shared";
import { InclusionConnectConfig } from "../../../../../../config/bootstrap/appConfig";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  InclusionConnectGateway,
} from "../../port/InclusionConnectGateway";

export const fakeInclusionConnectConfig: InclusionConnectConfig = {
  clientId: "my-client-id",
  clientSecret: "my-correct-token",
  immersionRedirectUri: {
    afterLogin: "http://immersion-uri.com/afterlogin",
    afterLogout: "http://immersion-uri.com/afterlogout",
  },
  inclusionConnectBaseUri: "http://fake-inclusion-connect-uri.com",
  scope: "my-scope",
};

export class InMemoryInclusionConnectGateway
  implements InclusionConnectGateway
{
  constructor(private inclusionConnectConfig: InclusionConnectConfig) {}

  public async getLoginUrl(params: GetLoginUrlParams): Promise<AbsoluteUrl> {
    return `${
      this.inclusionConnectConfig.inclusionConnectBaseUri
    }/login?${queryParamsAsString(params)}`;
  }

  public async getAccessToken(
    _: GetAccessTokenParams,
  ): Promise<GetAccessTokenResult> {
    if (this.#getAccessTokenResult) return this.#getAccessTokenResult;
    throw new Error("No access token provided (in memory)");
  }

  public async getLogoutUrl(): Promise<AbsoluteUrl> {
    return `${
      this.inclusionConnectConfig.inclusionConnectBaseUri
    }/logout/?${queryParamsAsString({
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
