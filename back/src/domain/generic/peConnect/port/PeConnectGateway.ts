import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
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
  redirect_uri: string;
};

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  oAuthGetAccessTokenThroughAuthorizationCode: (
    authorizationCode: string,
  ) => Promise<GetAccessTokenResponse>;
  getUserInfo: (
    accesstoken: GetAccessTokenResponse,
  ) => Promise<PeConnectUserInfo>;
}

export type ImmersionApplicationPeConnectFields = Pick<
  ImmersionApplicationDto,
  "email" | "firstName" | "lastName" | "peExternalId"
>;

export const peConnectUserInfoToImmersionApplicationDto = (
  peConnectUserInfo: PeConnectUserInfo,
): ImmersionApplicationPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.given_name,
  lastName: peConnectUserInfo.family_name,
  peExternalId: peConnectUserInfo.idIdentiteExterne,
});
