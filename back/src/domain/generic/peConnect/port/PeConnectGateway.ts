import { GetAccessTokenResponse } from "../../../core/ports/AccessTokenGateway";

export type PeConnectUserInfo = {
  sub: string;
  gender: string;
  family_name: string;
  given_name: string;
  email: string;
  idIdentiteExterne: string;
};

export type PeConnectOAuthGrantPayload = {
  response_type: string;
  client_id: string;
  realm: string;
  redirect_uri: string;
  scope: string;
};

export type PeConnectOAuthGetTokenWithCodeGrantPayload = {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
  realm: string;
  redirect_uri: string;
};

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => string;
  oAuthGetAccessTokenThroughAuthorizationCode: (
    authorizationCode: string,
  ) => Promise<GetAccessTokenResponse>;
  getUserInfo: (
    accesstoken: GetAccessTokenResponse,
  ) => Promise<PeConnectUserInfo>;
}
