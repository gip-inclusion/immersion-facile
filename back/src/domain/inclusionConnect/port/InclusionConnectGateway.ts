import { AbsoluteUrl } from "shared";
import { InclusionAccessTokenResponse } from "./InclusionAccessTokenResponse";

export type GetAccessTokenParams = {
  code: string;
  redirectUri: AbsoluteUrl;
};

export interface InclusionConnectGateway {
  getAccessToken: (
    params: GetAccessTokenParams,
  ) => Promise<InclusionAccessTokenResponse>;
}
