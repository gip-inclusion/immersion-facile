import {
  Beneficiary,
  FederatedIdentityProvider,
  InternshipKind,
  notJobSeeker,
  PeConnectToken,
  PeExternalId,
} from "shared";
import { EntityFromDto } from "../../core/EntityFromDto";
import { PeConnectImmersionAdvisorDto } from "./PeConnectAdvisor.dto";
import { PeConnectUserDto } from "./PeConnectUser.dto";

export type ConventionPoleEmploiUserAdvisorDto = {
  peExternalId: PeExternalId;
  conventionId: string;
  advisor?: PeConnectImmersionAdvisorDto;
};

export type ConventionPoleEmploiUserAdvisorEntity = EntityFromDto<
  ConventionPoleEmploiUserAdvisorDto,
  "ConventionPoleEmploiAdvisor"
>;

type BeneficiaryBasicIdentity = Pick<
  Beneficiary<InternshipKind>,
  "email" | "firstName" | "lastName"
>;

export type ConventionPeConnectFields = BeneficiaryBasicIdentity & {
  fedId: PeConnectToken;
  fedIdProvider: FederatedIdentityProvider;
};

export type PeUserAndAdvisor = {
  advisor: PeConnectImmersionAdvisorDto | undefined;
  user: PeConnectUserDto;
};

export const toPartialConventionDtoWithPeIdentity = (
  peConnectUserInfo: PeConnectUserDto,
): ConventionPeConnectFields => ({
  email: peConnectUserInfo.email || "",
  firstName: peConnectUserInfo.firstName,
  lastName: peConnectUserInfo.lastName,
  fedId: peConnectUserInfo.isJobseeker
    ? peConnectUserInfo.peExternalId
    : notJobSeeker,
  fedIdProvider: "peConnect",
});
