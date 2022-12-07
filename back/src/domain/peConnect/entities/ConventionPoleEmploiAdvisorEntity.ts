import { FederatedIdentity, PeConnectIdentity } from "shared";
import { peAdvisorsErrorCount } from "../../../adapters/secondary/PeConnectGateway/peConnectCounters";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../dto/PeConnect.dto";
import {
  AllPeConnectAdvisorDto,
  SupportedPeConnectAdvisorDto,
} from "../dto/PeConnectAdvisor.dto";

export const conventionPoleEmploiUserAdvisorFromDto = (
  dto: PeUserAndAdvisor,
): ConventionPoleEmploiUserAdvisorEntity => ({
  ...dto,
  conventionId: "",
  _entityName: "ConventionPoleEmploiAdvisor",
});

const preferCapEmploiPredicate = (
  a: SupportedPeConnectAdvisorDto,
  _: SupportedPeConnectAdvisorDto,
) => (a.type === "CAPEMPLOI" ? -1 : 1);

const onlyValidAdvisorsForImmersion = (
  advisor: AllPeConnectAdvisorDto,
): advisor is SupportedPeConnectAdvisorDto => advisor.type != "INDEMNISATION";

export const chooseValidAdvisor = (
  advisors: AllPeConnectAdvisorDto[],
): SupportedPeConnectAdvisorDto | undefined => {
  const sortedValidAdvisors: SupportedPeConnectAdvisorDto[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor) {
    peAdvisorsErrorCount.inc({ errorType: "peConnectNoValidAdvisor" });
    return undefined;
  }

  return preferredAdvisor;
};

export const isPeConnectIdentity = (
  peConnectIdentity: FederatedIdentity | undefined,
): peConnectIdentity is PeConnectIdentity =>
  !!peConnectIdentity && peConnectIdentity !== "noIdentityProvider";
