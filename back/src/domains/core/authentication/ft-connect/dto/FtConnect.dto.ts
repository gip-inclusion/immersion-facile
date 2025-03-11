import {
  type Beneficiary,
  type FederatedIdentityProvider,
  type FtConnectToken,
  type FtExternalId,
  type InternshipKind,
  notJobSeeker,
} from "shared";
import type { EntityFromDto } from "../../../../../utils/EntityFromDto";
import type { FtConnectImmersionAdvisorDto } from "./FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "./FtConnectUserDto";

export type ConventionFtUserAdvisorDto = {
  peExternalId: FtExternalId;
  conventionId: string;
  advisor?: FtConnectImmersionAdvisorDto;
};

export type ConventionFtUserAdvisorEntity = EntityFromDto<
  ConventionFtUserAdvisorDto,
  "ConventionFranceTravailAdvisor"
>;

type BeneficiaryBasicIdentity = Pick<
  Beneficiary<InternshipKind>,
  "email" | "firstName" | "lastName"
>;

export type ConventionFtConnectFields = BeneficiaryBasicIdentity & {
  fedId: FtConnectToken;
  fedIdProvider: FederatedIdentityProvider;
};

export type FtUserAndAdvisor = {
  advisor: FtConnectImmersionAdvisorDto | undefined;
  user: FtConnectUserDto;
};

export const toPartialConventionDtoWithFtIdentity = (
  ftConnectUserInfo: FtConnectUserDto,
): ConventionFtConnectFields => ({
  email: ftConnectUserInfo.email || "",
  firstName: ftConnectUserInfo.firstName,
  lastName: ftConnectUserInfo.lastName,
  fedId: ftConnectUserInfo.isJobseeker
    ? ftConnectUserInfo.peExternalId
    : notJobSeeker,
  fedIdProvider: "peConnect",
});
