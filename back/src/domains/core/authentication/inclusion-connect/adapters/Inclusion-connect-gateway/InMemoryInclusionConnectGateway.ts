import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  InclusionConnectGateway,
} from "../../port/InclusionConnectGateway";

export class InMemoryInclusionConnectGateway
  implements InclusionConnectGateway
{
  #getAccessTokenResult: GetAccessTokenResult | undefined = undefined;

  public async getAccessToken(
    _params: GetAccessTokenParams,
  ): Promise<GetAccessTokenResult> {
    if (this.#getAccessTokenResult) return this.#getAccessTokenResult;
    throw new Error("No access token provided (in memory)");
  }

  // for test purposes
  public setAccessTokenResponse(result: GetAccessTokenResult): void {
    this.#getAccessTokenResult = result;
  }
}
