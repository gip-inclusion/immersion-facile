import { AbsoluteUrl, queryParamsAsString } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { AppConfig } from "../../../../../../config/bootstrap/appConfig";
import { AccessTokenDto } from "../../dto/AccessToken.dto";
import { FtConnectAdvisorDto } from "../../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../../dto/FtConnectUserDto";
import {
  ExternalAccessToken,
  ExternalFtConnectAdvisor,
  ExternalFtConnectOAuthGrantPayload,
  ExternalFtConnectUser,
  ftConnectAccessTokenHeadersSchema,
} from "./ftConnectApi.dto";
import { ftConnectHeadersSchema } from "./ftConnectApi.schema";

const ftConnectNeededScopesForAllUsedApi = (clientId: string): string =>
  [
    `application_${clientId}`,
    "api_peconnect-individuv1",
    "api_peconnect-conseillersv1",
    "api_peconnect-statutv1",
    "individu",
    "openid",
    "profile",
    "email",
    "statut",
  ].join(" ");

type FtConnectRoutesConfig = {
  ftApiUrl: AbsoluteUrl;
  ftAuthCandidatUrl: AbsoluteUrl;
};

export type FtConnectExternalRoutes = ReturnType<
  typeof makeFtConnectExternalRoutes
>;

const _forceUnknownResponseBody = (responseBody: unknown): unknown =>
  responseBody;
// forceUnknownResponseBody is to avoid changing all the behavior related to peResponses being validated in the gateways
// TODO : move the validation here, and adapt the gateways
// explicitely : replace forceUnknownResponseBody by validation code made actually on adapter

export const makeFtConnectExternalRoutes = ({
  ftApiUrl,
  ftAuthCandidatUrl,
}: FtConnectRoutesConfig) =>
  defineRoutes({
    getAdvisorsInfo: defineRoute({
      method: "get",
      url: `${ftApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
      headersSchema: ftConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    getUserInfo: defineRoute({
      method: "get",
      url: `${ftApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
      headersSchema: ftConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    getUserStatutInfo: defineRoute({
      method: "get",
      url: `${ftApiUrl}/partenaire/peconnect-statut/v1/statut`,
      headersSchema: ftConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    exchangeCodeForAccessToken: defineRoute({
      method: "post",
      url: `${ftAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
      requestBodySchema: z.string(),
      headersSchema: ftConnectAccessTokenHeadersSchema,
      responses: { 200: z.any() },
    }),
  });

export const makeFtConnectLoginPageUrl = (appConfig: AppConfig): AbsoluteUrl =>
  makeOauthGetAuthorizationCodeRedirectUrl(appConfig.ftAuthCandidatUrl, {
    response_type: "code",
    client_id: appConfig.franceTravailClientId,
    realm: "/individu",
    redirect_uri: `${appConfig.immersionFacileBaseUrl}/api/pe-connect`,
    scope: ftConnectNeededScopesForAllUsedApi(appConfig.franceTravailClientId),
  });

const makeOauthGetAuthorizationCodeRedirectUrl = (
  peAuthCandidatUrl: AbsoluteUrl,
  authorizationCodePayload: ExternalFtConnectOAuthGrantPayload,
): AbsoluteUrl =>
  `${peAuthCandidatUrl}/connexion/oauth2/authorize?${queryParamsAsString<ExternalFtConnectOAuthGrantPayload>(
    authorizationCodePayload,
  )}`;

export const toFtConnectAdvisorDto = (
  fromApi: ExternalFtConnectAdvisor,
): FtConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toFtConnectUserDto = (
  externalFtConnectUser: ExternalFtConnectUser & { isUserJobseeker: boolean },
): FtConnectUserDto => ({
  isJobseeker: externalFtConnectUser.isUserJobseeker,
  email: externalFtConnectUser.email,
  firstName: externalFtConnectUser.given_name,
  lastName: externalFtConnectUser.family_name,
  peExternalId: externalFtConnectUser.idIdentiteExterne,
});

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});
