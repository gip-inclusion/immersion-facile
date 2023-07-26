import { InclusionAccessTokenResponse } from "../../../domain/inclusionConnect/port/InclusionAccessTokenResponse";
import { InclusionConnectGateway } from "../../../domain/inclusionConnect/port/InclusionConnectGateway";

// this token is for test purpose :

export const jwtGeneratedTokenFromFakeInclusionPayload =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5vdW5jZSIsInN1YiI6Im15LXVzZXItaWQiLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBpbmNsdXNpb24uY29tIn0.kHy9LewhgXGVPy9rwcRea6LufhvgBb4zpcXa_H0-fEHIQk6ZhMATHL3LR1bgYqAo4IBU-cg1HYEbiOYMVPd4kg";

// JWT contains the following payload :

export const fakeInclusionPayload = {
  nonce: "nounce",
  sub: "my-user-id",
  given_name: "John",
  family_name: "Doe",
  email: "john.doe@inclusion.com",
};

export const defaultInclusionAccessTokenResponse: InclusionAccessTokenResponse =
  {
    token_type: "Bearer",
    expires_in: 60,
    access_token: "initial-access-token",
    id_token: jwtGeneratedTokenFromFakeInclusionPayload,
  };

export class InMemoryInclusionConnectGateway
  implements InclusionConnectGateway
{
  private accessTokenResponse: InclusionAccessTokenResponse | undefined =
    undefined;

  async getAccessToken(_code: string): Promise<InclusionAccessTokenResponse> {
    if (this.accessTokenResponse) return this.accessTokenResponse;
    throw new Error("No access token provided (in memory)");
  }

  // for test purposes
  setAccessTokenResponse(response: InclusionAccessTokenResponse): void {
    this.accessTokenResponse = response;
  }
}
