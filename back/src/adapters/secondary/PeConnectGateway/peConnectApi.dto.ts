import { z } from "zod";

import { AbsoluteUrl } from "shared";

import { BearerToken } from "../../../domain/peConnect/dto/BearerToken";
import { PeConnectAdvisorsKind } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";

export type ExternalAccessToken = {
  access_token: string;
  expires_in: number;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect
export type ExternalPeConnectUser = {
  email?: string;
  family_name: string;
  gender: "male" | "female";
  given_name: string;
  idIdentiteExterne: string;
  sub: string;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect/statut
export type ExternalPeConnectStatut = {
  codeStatutIndividu: "0" | "1";
  libelleStatutIndividu: "Non demandeur d’emploi" | "Demandeur d’emploi";
};

// External contract from https://pole-emploi.io/data/api/conseillers
export type ExternalPeConnectAdvisor = {
  nom: string;
  prenom: string;
  civilite: "1" | "2";
  mail: string;
  type: PeConnectAdvisorsKind;
};

export type ExternalPeConnectAdvisors = ExternalPeConnectAdvisor[];

// External contract from https://pole-emploi.io/data/documentation/utilisation-api-pole-emploi/generer-access-token
export type ExternalPeConnectOAuthGrantPayload = {
  response_type: string;
  client_id: string;
  realm: string;
  redirect_uri: string;
  scope: string;
};

export type PeConnectHeaders = {
  "Content-Type": "application/json";
  Accept: "application/json";
  Authorization: BearerToken;
};

export type PeConnectAccessTokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded";
};
export const peConnectAccessTokenHeadersSchema: z.Schema<PeConnectAccessTokenHeaders> =
  z
    .object({
      "Content-Type": z.literal("application/x-www-form-urlencoded"),
    })
    .passthrough();

export type PeConnectOauthConfig = {
  poleEmploiClientId: string;
  poleEmploiClientSecret: string;
  immersionFacileBaseUrl: AbsoluteUrl;
};
