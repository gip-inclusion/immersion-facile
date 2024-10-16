import {
  AbsoluteUrl,
  Email,
  ExternalId,
  FeatureFlags,
  IdToken,
  OAuthGatewayProvider,
  WithIdToken,
  WithSourcePage,
} from "shared";
import { OAuthJwt } from "../entities/OngoingOAuth";

export type GetAccessTokenParams = WithSourcePage & {
  code: string;
};

export type GetAccessTokenPayload = {
  nonce: string;
  sub: ExternalId;
  firstName: string;
  lastName: string;
  email: Email;
  structure_pe?: string;
};

export type GetAccessTokenResult = {
  payload: GetAccessTokenPayload;
  expire: number;
  accessToken: OAuthJwt;
  idToken: IdToken;
};

export type GetLoginUrlParams = WithSourcePage & {
  nonce: string;
  state: string;
};

export const oAuthProviderByFeatureFlags = (
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
  getLogoutUrl(
    params: WithIdToken,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl>;
}
