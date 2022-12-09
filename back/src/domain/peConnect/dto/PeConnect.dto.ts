import { Beneficiary } from "shared";
import { EntityFromDto } from "../../core/EntityFromDto";
import { PeConnectImmersionAdvisorDto } from "./PeConnectAdvisor.dto";
import { PeConnectUserDto } from "./PeConnectUser.dto";

export type ConventionPoleEmploiUserAdvisorDto = {
  peExternalId: string;
  conventionId: string;
  advisor?: PeConnectImmersionAdvisorDto;
};

export type ConventionPoleEmploiUserAdvisorEntity = EntityFromDto<
  ConventionPoleEmploiUserAdvisorDto,
  "ConventionPoleEmploiAdvisor"
>;

export type ConventionPeConnectFields = Pick<
  Beneficiary,
  "email" | "firstName" | "lastName" | "federatedIdentity"
>;

export type PeUserAndAdvisor = {
  advisor: PeConnectImmersionAdvisorDto | undefined;
  user: PeConnectUserDto;
};

export const toPartialConventionDtoWithPeIdentity = (
  peConnectUserInfo: PeConnectUserDto,
): ConventionPeConnectFields => ({
  email: peConnectUserInfo.email,
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
  federatedIdentity: `peConnect:${peConnectUserInfo.peExternalId}`,
});
