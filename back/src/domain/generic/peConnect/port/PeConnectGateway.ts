import { GetAccessTokenResponse } from "../../../core/ports/AccessTokenGateway";

export type PeConnectUserInfo = {
  sub: string;
  gender: string;
  family_name: string;
  given_name: string;
  email: string;
  idIdentiteExterne: string;
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
