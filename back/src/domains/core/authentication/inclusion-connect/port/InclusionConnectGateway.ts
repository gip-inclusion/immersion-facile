import { AbsoluteUrl, WithSourcePage } from "shared";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
import { InclusionConnectOAuthJwt } from "../entities/OngoingOAuth";

export type GetAccessTokenParams = WithSourcePage & {
  code: string;
};

export type GetAccessTokenResult = {
  icIdTokenPayload: InclusionConnectIdTokenPayload;
  expire: number;
  accessToken: InclusionConnectOAuthJwt;
};

export type GetLoginUrlParams = WithSourcePage & {
  nonce: string;
  state: string;
};

export interface InclusionConnectGateway {
  getLoginUrl(params: GetLoginUrlParams): Promise<AbsoluteUrl>;
  getAccessToken: (
    params: GetAccessTokenParams,
  ) => Promise<GetAccessTokenResult>;
  getLogoutUrl(): Promise<AbsoluteUrl>;
}
