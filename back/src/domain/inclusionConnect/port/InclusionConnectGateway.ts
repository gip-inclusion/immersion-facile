import { AbsoluteUrl } from "shared";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";

export type GetAccessTokenParams = {
  code: string;
  redirectUri: AbsoluteUrl;
};

export type GetAccessTokenResult = {
  icIdTokenPayload: InclusionConnectIdTokenPayload;
  expire: number;
  accessToken: string;
};

export interface InclusionConnectGateway {
  getAccessToken: (
    params: GetAccessTokenParams,
  ) => Promise<GetAccessTokenResult>;
}
