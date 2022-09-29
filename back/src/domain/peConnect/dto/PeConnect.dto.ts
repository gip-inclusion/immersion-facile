import { Beneficiary, ExcludeFromExisting, NotEmptyArray } from "shared";
import { EntityFromDto } from "../../core/EntityFromDto";

export type PoleEmploiUserAdvisorDto = {
  userPeExternalId: string;
  firstName: string;
  lastName: string;
  email: string;
  type: ConventionPoleEmploiAdvisor;
};

export type ConventionPoleEmploiUserAdvisorDto = {
  conventionId: string;
} & PoleEmploiUserAdvisorDto;

export type ConventionPoleEmploiUserAdvisorEntity = EntityFromDto<
  ConventionPoleEmploiUserAdvisorDto,
  "ConventionPoleEmploiAdvisor"
>;

export type PeConnectUserDto = {
  email: string;
  firstName: string;
  lastName: string;
  peExternalId: string;
};

export type PeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorKind;
};

export type PeConnectAdvisorEntity = EntityFromDto<
  {
    email: string;
    firstName: string;
    lastName: string;
    type: ConventionPoleEmploiAdvisor;
  },
  "PeConnectAdvisorEntity"
>;

export type ConventionPeConnectFields = Pick<
  Beneficiary,
  "email" | "firstName" | "lastName" | "federatedIdentity"
>;

export const peExternalAdvisorsTypes = [
  "INDEMNISATION",
  "PLACEMENT",
  "CAPEMPLOI",
] as const;

export type AdvisorKind = typeof peExternalAdvisorsTypes[number];

type ConventionPoleEmploiAdvisor = ExcludeFromExisting<
  AdvisorKind,
  "INDEMNISATION"
>;

export const conventionPoleEmploiAdvisors: NotEmptyArray<ConventionPoleEmploiAdvisor> =
  ["PLACEMENT", "CAPEMPLOI"];

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDto = (
  fromApi: ExternalPeConnectUser,
): PeConnectUserDto => ({
  email: fromApi.email,
  firstName: fromApi.given_name,
  lastName: fromApi.family_name,
  peExternalId: fromApi.idIdentiteExterne,
});

export const toConventionPoleEmploiAdvisorDto = ({
  user,
  advisor,
}: PeUserAndAdvisor): PoleEmploiUserAdvisorDto => ({
  ...advisor,
  userPeExternalId: user.peExternalId,
});

export const toPartialConventionDtoWithPeIdentity = (
  peConnectUserInfo: PeConnectUserDto,
): ConventionPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
  federatedIdentity: `peConnect:${peConnectUserInfo.peExternalId}`,
});

export type PeUserAndAdvisors = {
  advisors: PeConnectAdvisorDto[];
  user: PeConnectUserDto;
};

export type PeUserAndAdvisor = {
  advisor: PeConnectAdvisorEntity;
  user: PeConnectUserDto;
};

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
