import {
  Beneficiary,
  FederatedIdentityProvider,
  FtConnectToken,
  FtExternalId,
  InternshipKind,
  notJobSeeker,
} from "shared";
import { EntityFromDto } from "../../../../../utils/EntityFromDto";
import { FtConnectImmersionAdvisorDto } from "./FtConnectAdvisor.dto";
import { FtConnectUserDto } from "./FtConnectUserDto";

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
