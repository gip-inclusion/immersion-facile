import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeConnectAdvisorDTO,
  PeUserAndAdvisors,
  PoleEmploiUserAdvisorDTO,
  toConventionPoleEmploiAdvisorDTO,
} from "../dto/PeConnect.dto";

export const conventionPoleEmploiAdvisorFromDto = (
  dto: PoleEmploiUserAdvisorDTO,
): ConventionPoleEmploiUserAdvisorEntity => ({
  ...dto,
  conventionId: "",
  _entityName: "ConventionPoleEmploiAdvisor",
});

export const poleEmploiUserAdvisorDTOFromUserAndAdvisors = ({
  user,
  advisors,
}: PeUserAndAdvisors): PoleEmploiUserAdvisorDTO =>
  toConventionPoleEmploiAdvisorDTO({
    user,
    advisor: choosePreferredAdvisor(advisors),
  });

const preferCapEmploiPredicate = (
  a: PeConnectAdvisorDTO,
  _: PeConnectAdvisorDTO,
) => (a.type === "CAPEMPLOI" ? -1 : 1);

const onlyValidAdvisorsForImmersion = (advisor: PeConnectAdvisorDTO) =>
  advisor.type != "INDEMNISATION";

const choosePreferredAdvisor = (
  advisors: PeConnectAdvisorDTO[],
): PeConnectAdvisorDTO => {
  const sortedAdvisors = advisors
    .filter(onlyValidAdvisorsForImmersion)
    .sort(preferCapEmploiPredicate);

  const preferredAdvisor = sortedAdvisors.at(0);
  if (!preferredAdvisor) throw new Error("No valid advisor for the user");

  return preferredAdvisor;
};
