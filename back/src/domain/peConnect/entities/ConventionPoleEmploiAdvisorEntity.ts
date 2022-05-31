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
  if (!preferredAdvisor) throw new Error("No valid advisor for the user");

  return preferredAdvisor;
};
