import { createLogger } from "../../../../../utils/logger";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../dto/PeConnect.dto";
import {
  PeConnectAdvisorDto,
  PeConnectImmersionAdvisorDto,
} from "../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../dto/PeConnectUser.dto";

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
): advisor is PeConnectImmersionAdvisorDto => advisor.type !== "INDEMNISATION";

const logger = createLogger(__filename);

export const chooseValidAdvisor = (
  { peExternalId }: PeConnectUserDto,
  advisors: PeConnectAdvisorDto[],
): PeConnectImmersionAdvisorDto | undefined => {
  const sortedValidAdvisors: PeConnectImmersionAdvisorDto[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor) {
    logger.error({
      ftConnect: {
        peExternalId,
      },
      message: "getAdvisorsInfo - peConnectNoValidAdvisor",
    });
    return undefined;
  }

  return preferredAdvisor;
};
