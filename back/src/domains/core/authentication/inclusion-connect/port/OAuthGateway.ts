import type {
  AbsoluteUrl,
  Email,
  ExternalId,
  IdToken,
  SiretDto,
  WithIdToken,
} from "shared";
import type { OAuthJwt } from "../entities/OngoingOAuth";

export type GetAccessTokenParams = {
  code: string;
};

export type GetAccessTokenPayload = {
  nonce: string;
  sub: ExternalId;
  firstName: string;
  lastName: string;
  email: Email;
  structure_pe?: string;
  siret: SiretDto;
};

export type GetAccessTokenResult = {
  payload: GetAccessTokenPayload;
  expire: number;
  accessToken: OAuthJwt;
  idToken: IdToken;
};

export type GetLoginUrlParams = {
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
