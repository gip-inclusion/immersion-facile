import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { EntityFromDto } from "../../core/EntityFromDto";

export type PoleEmploiUserAdvisorDTO = {
  userPeExternalId: string;
  firstName: string;
  lastName: string;
  email: string;
  type: ConventionPoleEmploiAdvisor;
};

export type ConventionPoleEmploiUserAdvisorEntity = EntityFromDto<
  {
    conventionId: string;
  } & PoleEmploiUserAdvisorDTO,
  "ConventionPoleEmploiAdvisor"
>;

export type PeConnectUserDTO = {
  email: string;
  firstName: string;
  lastName: string;
  peExternalId: string;
};

export type PeConnectAdvisorDTO = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorTypes;
};

export type ConventionPeConnectFields = Pick<
  ImmersionApplicationDto,
  "email" | "firstName" | "lastName"
>;

export const peExternalAdvisorsTypes = [
  "INDEMNISATION",
  "PLACEMENT",
  "CAPEMPLOI",
] as const;

export type AdvisorTypes = typeof peExternalAdvisorsTypes[number];

type ConventionPoleEmploiAdvisor = Omit<AdvisorTypes, "INDEMNISATION">;

export const conventionPoleEmploiAdvisors = ["PLACEMENT", "CAPEMPLOI"] as const;

export const toPeConnectAdvisorDTO = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDTO => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDTO = (
  fromApi: ExternalPeConnectUser,
): PeConnectUserDTO => ({
  email: fromApi.email,
  firstName: fromApi.given_name,
  lastName: fromApi.family_name,
  peExternalId: fromApi.idIdentiteExterne,
});

export const toConventionPoleEmploiAdvisorDTO = ({
  user,
  advisor,
}: PeUserAndAdvisor): PoleEmploiUserAdvisorDTO => ({
  ...advisor,
  userPeExternalId: user.peExternalId,
});

export const toPartialConventionDto = (
  peConnectUserInfo: PeConnectUserDTO,
): ConventionPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
});

export type PeUserAndAdvisors = {
  advisors: PeConnectAdvisorDTO[];
  user: PeConnectUserDTO;
};

export type PeUserAndAdvisor = {
  advisor: PeConnectAdvisorDTO;
  user: PeConnectUserDTO;
};

export type PeExternalId = string;

// External contract from https://pole-emploi.io/data/api/pole-emploi-connect
export type ExternalPeConnectUser = {
  email: string;
  family_name: string;
  gender: string;
  given_name: string;
  idIdentiteExterne: string;
  sub: string;
};

// External contract from https://pole-emploi.io/data/api/conseillers
export type ExternalPeConnectAdvisor = {
  nom: string;
  prenom: string;
  civilite: string;
  mail: string;
  type: AdvisorTypes;
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
