import { getAdvisorsInfoCounter } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../dto/PeConnect.dto";
import {
  PeConnectAdvisorDto,
  PeConnectImmersionAdvisorDto,
} from "../dto/PeConnectAdvisor.dto";

export const conventionPoleEmploiUserAdvisorFromDto = (
  dto: PeUserAndAdvisor,
  conventionId: string,
): ConventionPoleEmploiUserAdvisorEntity => ({
  advisor: dto.advisor,
  peExternalId: dto.user.peExternalId,
  conventionId,
  _entityName: "ConventionPoleEmploiAdvisor",
});

const preferCapEmploiPredicate = (
  a: PeConnectImmersionAdvisorDto,
  _: PeConnectImmersionAdvisorDto,
) => (a.type === "CAPEMPLOI" ? -1 : 1);

const onlyValidAdvisorsForImmersion = (
  advisor: PeConnectAdvisorDto,
): advisor is PeConnectImmersionAdvisorDto => advisor.type != "INDEMNISATION";

const logger = createLogger(__filename);

export const chooseValidAdvisor = (
  advisors: PeConnectAdvisorDto[],
): PeConnectImmersionAdvisorDto | undefined => {
  const sortedValidAdvisors: PeConnectImmersionAdvisorDto[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor) {
    getAdvisorsInfoCounter.error.inc({ errorType: "peConnectNoValidAdvisor" });
    logger.error({ errorType: "peConnectNoValidAdvisor" }, "getAdvisorsInfo");
    return undefined;
  }

  return preferredAdvisor;
};
