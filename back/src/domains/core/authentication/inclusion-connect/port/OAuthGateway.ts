import {
  AbsoluteUrl,
  Email,
  ExternalId,
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
  siret?: string; // remove optional when inclusion connect is removed
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

export type GetLogoutUrlParams = WithIdToken & {
  state: string;
};

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
    params: GetLogoutUrlParams,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl>;
}
