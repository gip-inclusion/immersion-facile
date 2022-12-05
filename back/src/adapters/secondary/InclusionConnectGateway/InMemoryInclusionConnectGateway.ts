import {
  InclusionAccessTokenResponse,
  InclusionConnectGateway,
} from "../../../domain/inclusionConnect/port/InclusionConnectGateway";
import { fakeInclusionIdTokenWithCorrectPayload } from "../../../domain/inclusionConnect/useCases/fakeInclusionIdTokenWithCorrectPayload";

export class InMemoryInclusionConnectGateway
  implements InclusionConnectGateway
{
  private accessTokenResponse: InclusionAccessTokenResponse = {
    token_type: "Bearer",
    expires_in: 60,
    access_token: "initial-access-token",
    id_token: fakeInclusionIdTokenWithCorrectPayload,
    // this is a jwt generated with a deprecated private key, containing the following payload :
    // {
    //   "nonce": "nounce",
    //   "sub": "my-user-id",
    //   "given_name": "John",
    //   "family_name": "Doe",
    //   "email": "john.doe@inclusion.com"
    // }
  };

  async getAccessToken(_code: string): Promise<InclusionAccessTokenResponse> {
    return this.accessTokenResponse;
  }

  // for test purposes
  setAccessTokenResponse(
    response: Partial<InclusionAccessTokenResponse>,
  ): void {
    this.accessTokenResponse = { ...this.accessTokenResponse, ...response };
  }
}
