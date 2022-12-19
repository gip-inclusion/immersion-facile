import { InclusionAccessTokenResponse } from "./InclusionAccessTokenResponse";

export interface InclusionConnectGateway {
  getAccessToken: (code: string) => Promise<InclusionAccessTokenResponse>;
}
