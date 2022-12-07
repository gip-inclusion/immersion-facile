import { Beneficiary } from "shared";
import { EntityFromDto } from "../../core/EntityFromDto";
import { SupportedPeConnectAdvisorDto } from "./PeConnectAdvisor.dto";
import { PeConnectUserDto } from "./PeConnectUser.dto";

export type ConventionPoleEmploiUserAdvisorDto = {
  conventionId: string;
} & PeUserAndAdvisor;

export type ConventionPoleEmploiUserAdvisorEntity = EntityFromDto<
  ConventionPoleEmploiUserAdvisorDto,
  "ConventionPoleEmploiAdvisor"
>;

export type ConventionPeConnectFields = Pick<
  Beneficiary,
  "email" | "firstName" | "lastName" | "federatedIdentity"
>;

export const toPartialConventionDtoWithPeIdentity = (
  peConnectUserInfo: PeConnectUserDto,
): ConventionPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
  federatedIdentity: `peConnect:${peConnectUserInfo.peExternalId}`,
});

export type PeUserAndAdvisor = {
  advisor: SupportedPeConnectAdvisorDto | undefined;
  user: PeConnectUserDto;
};
