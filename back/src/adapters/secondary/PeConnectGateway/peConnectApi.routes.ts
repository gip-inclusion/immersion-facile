import { z } from "zod";
import { AbsoluteUrl, queryParamsAsString } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { AppConfig } from "../../primary/config/appConfig";
import {
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  ExternalPeConnectOAuthGrantPayload,
  ExternalPeConnectUser,
  peConnectAccessTokenHeadersSchema,
} from "./peConnectApi.dto";
import { peConnectHeadersSchema } from "./peConnectApi.schema";

const peConnectNeededScopesForAllUsedApi = (clientId: string): string =>
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

type PeConnectRoutesConfig = {
  peApiUrl: AbsoluteUrl;
  peAuthCandidatUrl: AbsoluteUrl;
};

export type PeConnectExternalRoutes = ReturnType<
  typeof makePeConnectExternalRoutes
>;

const _forceUnknownResponseBody = (responseBody: unknown): unknown =>
  responseBody;
// forceUnknownResponseBody is to avoid changing all the behavior related to peResponses being validated in the gateways
// TODO : move the validation here, and adapt the gateways
// explicitely : replace forceUnknownResponseBody by validation code made actually on adapter

export const makePeConnectExternalRoutes = ({
  peApiUrl,
  peAuthCandidatUrl,
}: PeConnectRoutesConfig) =>
  defineRoutes({
    getAdvisorsInfo: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
      headersSchema: peConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    getUserInfo: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
      headersSchema: peConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    getUserStatutInfo: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/peconnect-statut/v1/statut`,
      headersSchema: peConnectHeadersSchema,
      responses: { 200: z.any() },
    }),
    exchangeCodeForAccessToken: defineRoute({
      method: "post",
      url: `${peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
      requestBodySchema: z.string(),
      headersSchema: peConnectAccessTokenHeadersSchema,
      responses: { 200: z.any() },
    }),
  });

export const makePeConnectLoginPageUrl = (appConfig: AppConfig): AbsoluteUrl =>
  makeOauthGetAuthorizationCodeRedirectUrl(appConfig.peAuthCandidatUrl, {
    response_type: "code",
    client_id: appConfig.poleEmploiClientId,
    realm: "/individu",
    redirect_uri: `${appConfig.immersionFacileBaseUrl}/api/pe-connect`,
    scope: peConnectNeededScopesForAllUsedApi(appConfig.poleEmploiClientId),
  });

const makeOauthGetAuthorizationCodeRedirectUrl = (
  peAuthCandidatUrl: AbsoluteUrl,
  authorizationCodePayload: ExternalPeConnectOAuthGrantPayload,
): AbsoluteUrl =>
  `${peAuthCandidatUrl}/connexion/oauth2/authorize?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
    authorizationCodePayload,
  )}`;

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDto = (
  externalPeConnectUser: ExternalPeConnectUser & { isUserJobseeker: boolean },
): PeConnectUserDto => ({
  isJobseeker: externalPeConnectUser.isUserJobseeker,
  email: externalPeConnectUser.email,
  firstName: externalPeConnectUser.given_name,
  lastName: externalPeConnectUser.family_name,
  peExternalId: externalPeConnectUser.idIdentiteExterne,
});

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});
