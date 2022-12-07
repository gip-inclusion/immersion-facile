import {
  configureHttpClient,
  createTargets,
  CreateTargets,
  HandlerCreator,
  HttpClient,
  Target,
} from "http-client";
import { zTrimmedString } from "shared";
import { z } from "zod";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { BearerToken } from "../../../domain/peConnect/dto/BearerToken";
import {
  AdvisorKind,
  peAdvisorsSupportedTypes,
} from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { AppConfig } from "../../primary/config/appConfig";

export type PeConnectTargets = CreateTargets<{
  getUserInfo: Target<void, void, PeConnectHeaders>;
  getAdvisorsInfo: Target<void, void, PeConnectHeaders>;
  getUserStatutInfo: Target<void, void, PeConnectHeaders>;
  oauth2Step2AccessToken: Target<
    ExternalPeConnectOAuthGetTokenWithCodeGrantPayload,
    void,
    PeConnectAccessTokenHeaders
  >;
}>;

export type PeConnectTargetsKind = keyof PeConnectTargets;

export const makePeConnectHttpClient = (
  handlerCreator: HandlerCreator,
  appConfig: AppConfig,
): HttpClient<PeConnectTargets> =>
  configureHttpClient(handlerCreator)<PeConnectTargets>(
    peConnectTargets(appConfig),
  );

export const peConnectTargets = (appConfig: AppConfig) =>
  createTargets<PeConnectTargets>({
    getAdvisorsInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
    },
    getUserInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
    },
    getUserStatutInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-statut/v1/statut`,
    },
    oauth2Step2AccessToken: {
      method: "POST",
      url: `${appConfig.peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
    },
  });

export type ExternalAccessToken = {
  access_token: string;
  expires_in: number;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect
export type ExternalPeConnectUser = {
  email: string;
  family_name: string;
  gender: "male" | "female";
  given_name: string;
  idIdentiteExterne: string;
  sub: string;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect/statut
export type ExternalPeConnectStatut = {
  codeStatutIndividu: "0" | "1";
  libelleStatutIndividu: "Non demandeur d'emploi" | "Demandeur d'emploi";
};

// External contract from https://pole-emploi.io/data/api/conseillers
export type ExternalPeConnectAdvisor = {
  nom: string;
  prenom: string;
  civilite: "1" | "2";
  mail: string;
  type: AdvisorKind;
};

// External contract from https://pole-emploi.io/data/documentation/utilisation-api-pole-emploi/generer-access-token
export type ExternalPeConnectOAuthGrantPayload = {
  response_type: string;
  client_id: string;
  realm: string;
  redirect_uri: string;
  scope: string;
};

// External Contract from https://pole-emploi.io/data/documentation/comprendre-dispositif-pole-emploi-connect/open-id-connect/generer-access-token
export type ExternalPeConnectOAuthGetTokenWithCodeGrantPayload = {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
};

export type PeConnectHeaders = {
  "Content-Type": "application/json";
  Accept: "application/json";
  Authorization: BearerToken;
};

export type PeConnectAccessTokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded";
};

export const externalPeConnectUserSchema: z.Schema<ExternalPeConnectUser> =
  z.object({
    email: z
      .string()
      .email("L'addresse email pole emploi doit être remplie valide"),
    family_name: zTrimmedString,
    gender: z.enum(["male", "female"]),
    given_name: zTrimmedString,
    idIdentiteExterne: z.string().uuid(),
    sub: z.string().uuid(),
  });

export const externalPeConnectUserStatutSchema: z.Schema<ExternalPeConnectStatut> =
  z.object({
    codeStatutIndividu: z.enum(["0", "1"]),
    libelleStatutIndividu: z.enum([
      "Non demandeur d'emploi",
      "Demandeur d'emploi",
    ]),
  });

export const externalPeConnectAdvisorSchema: z.Schema<ExternalPeConnectAdvisor> =
  z.object({
    nom: zTrimmedString,
    prenom: zTrimmedString,
    civilite: z.enum(["1", "2"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: z.enum(peAdvisorsSupportedTypes),
  });

export const externalPeConnectAdvisorsSchema: z.Schema<
  ExternalPeConnectAdvisor[]
> = z.array(externalPeConnectAdvisorSchema);

export const peConnectheadersWithBearerAuthToken = (
  accessToken: AccessTokenDto,
): PeConnectHeaders => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${accessToken.value}`,
});
