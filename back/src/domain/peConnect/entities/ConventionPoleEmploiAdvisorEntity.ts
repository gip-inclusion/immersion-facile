import { FederatedIdentity, PeConnectIdentity } from "shared";
import { ManagedRedirectError } from "../../../adapters/primary/helpers/redirectErrors";
import { peAdvisorsErrorCount } from "../../../adapters/secondary/PeConnectGateway/peConnectCounters";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeConnectAdvisorDto,
  PeConnectAdvisorEntity,
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
    advisor: choosePreferredAdvisor(advisors),
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
): PeConnectAdvisorEntity => {
  const sortedValidAdvisors: PeConnectAdvisorEntity[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor) {
    peAdvisorsErrorCount.inc({ errorType: "peConnectNoValidAdvisor" });
    throw new ManagedRedirectError("peConnectNoValidAdvisor");
  }

  return preferredAdvisor;
};

export const isPeConnectIdentity = (
  peConnectIdentity: FederatedIdentity | undefined,
): peConnectIdentity is PeConnectIdentity =>
  !!peConnectIdentity && peConnectIdentity !== "noIdentityProvider";
