import {
  PeConnectAdvisorDTO,
  PeUserAndAdvisors,
  PoleEmploiUserAdvisorDTO,
  toConventionPoleEmploiAdvisorDTO,
} from "../dto/PeConnect.dto";

export namespace ConventionPoleEmploiAdvisorEntity {
  export const createFromUserAndAdvisors = ({
    user,
    advisors,
  }: PeUserAndAdvisors): PoleEmploiUserAdvisorDTO =>
    toConventionPoleEmploiAdvisorDTO({
      user,
      advisor: choosePreferredAdvisor(advisors),
    });
}

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

  return sortedAdvisors[0];
};
