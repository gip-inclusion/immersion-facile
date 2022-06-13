import {
  FederatedIdentity,
  PeConnectIdentity,
} from "shared/src/federatedIdentities/federatedIdentity.dto";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeConnectAdvisorDto,
  PeConnectAdvisorEntity,
  PeConnectUserDto,
  PeUserAndAdvisors,
  PoleEmploiUserAdvisorDto,
  toConventionPoleEmploiAdvisorDto,
} from "../dto/PeConnect.dto";

export const conventionPoleEmploiUserAdvisorFromDto = (
  dto: PoleEmploiUserAdvisorDto,
): ConventionPoleEmploiUserAdvisorEntity => ({
  ...dto,
  conventionId: "",
  _entityName: "ConventionPoleEmploiAdvisor",
});

export const poleEmploiUserAdvisorDTOFromUserAndAdvisors = ({
  user,
  advisors,
}: PeUserAndAdvisors): PoleEmploiUserAdvisorDto =>
  toConventionPoleEmploiAdvisorDto({
    user,
    advisor: choosePreferredAdvisor(advisors, user),
  });

const preferCapEmploiPredicate = (
  a: PeConnectAdvisorDto,
  _: PeConnectAdvisorDto,
) => (a.type === "CAPEMPLOI" ? -1 : 1);

const onlyValidAdvisorsForImmersion = (
  advisor: PeConnectAdvisorDto,
): advisor is PeConnectAdvisorEntity => advisor.type != "INDEMNISATION";

const choosePreferredAdvisor = (
  advisors: PeConnectAdvisorDto[],
  user: PeConnectUserDto,
): PeConnectAdvisorEntity => {
  const sortedValidAdvisors: PeConnectAdvisorEntity[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor)
    throw new Error(
      `No valid advisor for the user ${user.email} ${user.firstName} ${
        user.lastName
      } ${user.peExternalId} | advisors ${JSON.stringify(advisors, null, 2)} `,
    );

  return preferredAdvisor;
};

export const isPeConnectIdentity = (
  peConnectIdentity: FederatedIdentity | undefined,
): peConnectIdentity is PeConnectIdentity =>
  !!peConnectIdentity && peConnectIdentity !== "noIdentityProvider";
