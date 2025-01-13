import { createLogger } from "../../../../../utils/logger";
import {
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";
import {
  FtConnectAdvisorDto,
  FtConnectImmersionAdvisorDto,
} from "../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../dto/FtConnectUserDto";

export const conventionFranceTravailUserAdvisorFromDto = (
  dto: FtUserAndAdvisor,
  conventionId: string,
): ConventionFtUserAdvisorEntity => ({
  advisor: dto.advisor,
  peExternalId: dto.user.peExternalId,
  conventionId,
  _entityName: "ConventionFranceTravailAdvisor",
});

const preferCapEmploiPredicate = (
  a: FtConnectImmersionAdvisorDto,
  _: FtConnectImmersionAdvisorDto,
) => (a.type === "CAPEMPLOI" ? -1 : 1);

const onlyValidAdvisorsForImmersion = (
  advisor: FtConnectAdvisorDto,
): advisor is FtConnectImmersionAdvisorDto => advisor.type !== "INDEMNISATION";

const logger = createLogger(__filename);

export const chooseValidAdvisor = (
  { peExternalId }: FtConnectUserDto,
  advisors: FtConnectAdvisorDto[],
): FtConnectImmersionAdvisorDto | undefined => {
  const sortedValidAdvisors: FtConnectImmersionAdvisorDto[] = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedValidAdvisors.at(0);
  if (!preferredAdvisor) {
    logger.error({
      ftConnect: {
        peExternalId,
      },
      message: "getAdvisorsInfo - ftConnectNoValidAdvisor",
    });
    return undefined;
  }

  return preferredAdvisor;
};
