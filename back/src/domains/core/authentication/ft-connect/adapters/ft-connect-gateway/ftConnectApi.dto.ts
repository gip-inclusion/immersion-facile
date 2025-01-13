import { AbsoluteUrl } from "shared";
import { z } from "zod";
import { BearerToken } from "../../dto/BearerToken";
import { FtConnectAdvisorsKind } from "../../dto/FtConnectAdvisor.dto";

export type ExternalAccessToken = {
  access_token: string;
  expires_in: number;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect
export type ExternalFtConnectUser = {
  email?: string;
  family_name: string;
  gender: "male" | "female";
  given_name: string;
  idIdentiteExterne: string;
  sub: string;
};

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect/statut
export type ExternalFtConnectStatut = {
  codeStatutIndividu: "0" | "1";
  libelleStatutIndividu: "Non demandeur d’emploi" | "Demandeur d’emploi";
};

// External contract from https://pole-emploi.io/data/api/conseillers
export type ExternalFtConnectAdvisor = {
  nom: string;
  prenom: string;
  civilite: "1" | "2";
  mail: string;
  type: FtConnectAdvisorsKind;
};

// External contract from https://pole-emploi.io/data/documentation/utilisation-api-pole-emploi/generer-access-token
export type ExternalFtConnectOAuthGrantPayload = {
  response_type: string;
  client_id: string;
  realm: string;
  redirect_uri: string;
  scope: string;
};

export type FtConnectHeaders = {
  "Content-Type": "application/json";
  Accept: "application/json";
  Authorization: BearerToken;
};

type FtConnectAccessTokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded";
};
export const ftConnectAccessTokenHeadersSchema: z.Schema<FtConnectAccessTokenHeaders> =
  z
    .object({
      "Content-Type": z.literal("application/x-www-form-urlencoded"),
    })
    .passthrough();

export type FtConnectOauthConfig = {
  franceTravailClientId: string;
  franceTravailClientSecret: string;
  immersionFacileBaseUrl: AbsoluteUrl;
};
