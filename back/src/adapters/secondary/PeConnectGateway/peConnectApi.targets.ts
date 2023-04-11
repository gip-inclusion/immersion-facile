import { createTarget, createTargets } from "http-client";
import { AbsoluteUrl, queryParamsAsString } from "shared";
import { z } from "zod";
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

// export const makePeConnectHttpClient = (
//   handlerCreator: HandlerCreator,
//   peConnectConfig: PeConnectTargetsConfig,
// ): HttpClient<PeConnectTargets> =>
//   configureHttpClient(handlerCreator)<PeConnectTargets>(
//     createPeConnectTargets(peConnectConfig),
//   );

export const peConnectNeededScopesForAllUsedApi = (clientId: string): string =>
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

type PeConnectTargetsConfig = {
  peApiUrl: AbsoluteUrl;
  peAuthCandidatUrl: AbsoluteUrl;
};

export type PeConnectExternalTargets = ReturnType<
  typeof makePeConnectExternalTargets
>;

const forceUnknownResponseBody = (responseBody: unknown): unknown =>
  responseBody;
// forceUnknownResponseBody is to avoid changing all the behavior related to peResponses being validated in the gateways
// TODO : move the validation here, and adapt the gateways

export const makePeConnectExternalTargets = ({
  peApiUrl,
  peAuthCandidatUrl,
}: PeConnectTargetsConfig) =>
  createTargets({
    getAdvisorsInfo: createTarget({
      method: "GET",
      url: `${peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
      validateHeaders: peConnectHeadersSchema.parse,
      validateResponseBody: forceUnknownResponseBody,
    }),
    getUserInfo: createTarget({
      method: "GET",
      url: `${peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
      validateHeaders: peConnectHeadersSchema.parse,
      validateResponseBody: forceUnknownResponseBody,
    }),
    getUserStatutInfo: createTarget({
      method: "GET",
      url: `${peApiUrl}/partenaire/peconnect-statut/v1/statut`,
      validateHeaders: peConnectHeadersSchema.parse,
      validateResponseBody: forceUnknownResponseBody,
    }),
    exchangeCodeForAccessToken: createTarget({
      method: "POST",
      url: `${peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
      validateHeaders: peConnectAccessTokenHeadersSchema.parse,
      validateRequestBody: z.string().parse,
      validateResponseBody: forceUnknownResponseBody,
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

export const makeOauthGetAuthorizationCodeRedirectUrl = (
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
