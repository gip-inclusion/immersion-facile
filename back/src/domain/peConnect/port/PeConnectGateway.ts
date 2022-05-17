// TODO Du rangement ! :D

import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { zString, zTrimmedString } from "shared/src/zodUtils";
import { z } from "../../../../node_modules/zod";

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect
export type ExternalPeConnectUser = {
  email: string;
  family_name: string;
  gender: string;
  given_name: string;
  idIdentiteExterne: string;
  sub: string;
};

export type PeConnectUserDTO = {
  email: string;
  firstName: string;
  lastName: string;
  peExternalId: string;
};

export type ExternalAccessToken = {
  access_token: string;
  expires_in: number;
};

export type AccessToken = {
  value: string;
  expiresIn: number;
};

export const externalAccessTokenSchema: z.Schema<ExternalAccessToken> =
  z.object({
    access_token: zString
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, "Le format du token peConnect est invalide"),
    expires_in: z.number().min(1, "Ce token est déja expiré"),
  });

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessToken => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});

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

export const toPeConnectUserDTO = (
  fromApi: ExternalPeConnectUser,
): PeConnectUserDTO => ({
  email: fromApi.email,
  firstName: fromApi.given_name,
  lastName: fromApi.family_name,
  peExternalId: fromApi.idIdentiteExterne,
});

export const peExternalAdvisorsTypes = [
  "INDEMNISATION",
  "PLACEMENT",
  "CAPEMPLOI",
] as const;

export type AdvisorTypes = typeof peExternalAdvisorsTypes[number];

/*const isAdvisor = (element: any): element is AdvisorTypes =>
  peAdvisorsTypes.includes(element);*/

// External contract from https://pole-emploi.io/data/api/conseillers
export type ExternalPeConnectAdvisor = {
  nom: string;
  prenom: string;
  civilite: string;
  mail: string;
  type: AdvisorTypes;
};

export const externalPeConnectAdvisorSchema: z.Schema<ExternalPeConnectAdvisor> =
  z.object({
    nom: zTrimmedString,
    prenom: zTrimmedString,
    civilite: z.enum(["0", "1"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: z.enum(peExternalAdvisorsTypes),
  });

export const externalPeConnectAdvisorsSchema: z.Schema<
  ExternalPeConnectAdvisor[]
> = z.array(externalPeConnectAdvisorSchema);

//const validAdvisorTypes: NotEmptyArray<AdvisorTypes> = ["INDEMNISATION" | "PLACEMENT" | "CAPEMPLOI"];
//const isAdvisorTypeWithTypes = (element: string): element is AdvisorTypes => element === "PLACEMENT" || element === "CAPEMPLOI"
/*const isAdvisorTypeWithString = (element: string): element is AdvisorTypes =>
  element === "PLACEMENT" || element === "CAPEMPLOI";
const stringToAdvisor = (element: string): AdvisorTypes => {
  switch (element) {
    case "PLACEMENT":
      return "PLACEMENT";
    case "CAPEMPLOI":
      return "CAPEMPLOI";
    case "INDEMNISATION":
      return "INDEMNISATION";
    default:
      throw new Error(
        `Le type du conseiller: ${element} n'est pas pris en charge`,
      );
  }
};*/

/*enum ValidAdvisorTypes {
  INDEMNISATION = "INDEMNISATION",
  PLACEMENT = "PLACEMENT",
  CAPEMPLOI = "CAPEMPLOI"
};*/

//
//const isAdvisor = (element: any): element is AdvisorTypes => advisors.includes(element);

export const toPeConnectAdvisorDTO = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDTO => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

// External contract from https://pole-emploi.io/data/documentation/utilisation-api-pole-emploi/generer-access-token
export type PeConnectOAuthGrantPayload = {
  response_type: string;
  client_id: string;
  realm: string;
  redirect_uri: string;
  scope: string;
};

// External Contract from https://pole-emploi.io/data/documentation/comprendre-dispositif-pole-emploi-connect/open-id-connect/generer-access-token
export type PeConnectOAuthGetTokenWithCodeGrantPayload = {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
};

export type PeConnectAdvisorDTO = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorTypes;
};

export type PeUserAndAdvisors = {
  advisors: PeConnectAdvisorDTO[];
  user: PeConnectUserDTO;
};

export type PeUserAndAdvisor = {
  advisor: PeConnectAdvisorDTO;
  user: PeConnectUserDTO;
};

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  oAuthGetAccessTokenThroughAuthorizationCode: (
    authorizationCode: string,
  ) => Promise<AccessToken>;

  getUserInfo: (accesstoken: AccessToken) => Promise<PeConnectUserDTO>;

  getAdvisorsInfo: (accesstoken: AccessToken) => Promise<PeConnectAdvisorDTO[]>;

  getUserAndAdvisors: (authorizationCode: string) => Promise<PeUserAndAdvisors>;
}

export type ImmersionApplicationPeConnectFields = Pick<
  ImmersionApplicationDto,
  "email" | "firstName" | "lastName"
>;

export const peConnectUserInfoToImmersionApplicationDto = (
  peConnectUserInfo: PeConnectUserDTO,
): ImmersionApplicationPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
});

export type PeExternalId = string;
