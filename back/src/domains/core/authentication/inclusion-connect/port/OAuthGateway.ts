import { AbsoluteUrl, FeatureFlags, WithSourcePage } from "shared";
import { OAuthIdTokenPayload } from "../entities/OAuthIdTokenPayload";
import { OAuthJwt } from "../entities/OngoingOAuth";

export type GetAccessTokenParams = WithSourcePage & {
  code: string;
};

export type GetAccessTokenResult = {
  oAuthIdTokenPayload: OAuthIdTokenPayload;
  expire: number;
  accessToken: OAuthJwt;
};

export type GetLoginUrlParams = WithSourcePage & {
  nonce: string;
  state: string;
};

export const oAuthGatewayModes = ["InclusionConnect", "ProConnect"] as const;
export type OAuthGatewayProvider = (typeof oAuthGatewayModes)[number];

export const oAuthModeByFeatureFlags = (
  flags: FeatureFlags,
): OAuthGatewayProvider =>
  flags.enableProConnect.isActive ? "ProConnect" : "InclusionConnect";

export interface OAuthGateway {
  getLoginUrl(
    params: GetLoginUrlParams,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl>;
  getAccessToken: (
    params: GetAccessTokenParams,
    provider: OAuthGatewayProvider,
  ) => Promise<GetAccessTokenResult>;
  getLogoutUrl(mode: OAuthGatewayProvider): Promise<AbsoluteUrl>;
}
