import {
  AbsoluteUrl,
  Email,
  ExternalId,
  IdToken,
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
  getLoginUrl(params: GetLoginUrlParams): Promise<AbsoluteUrl>;
  getAccessToken: (
    params: GetAccessTokenParams,
  ) => Promise<GetAccessTokenResult>;
  getLogoutUrl(params: GetLogoutUrlParams): Promise<AbsoluteUrl>;
}
