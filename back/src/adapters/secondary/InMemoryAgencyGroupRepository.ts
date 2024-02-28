import { values } from "ramda";
import { AgencyGroup, CodeSafir } from "shared";
import { AgencyGroupRepository } from "../../domains/convention/ports/AgencyGroupRepository";

const testAgencyGroups: AgencyGroup[] = [
  {
    siret: "12345678902345",
    kind: "france-travail",
    email: "agency-group-1-email@gmail.com",
    codeSafir: "dr-safir-code",
    departments: ["87", "23", "19"],
    name: "DR du limousin",
    scope: "direction-régionale",
    agencyIds: ["test-agency-1-back", "test-agency-2-back"],
    ccEmails: ["fake-email1@gmail.com", "fake-email2@gmail.com"],
  },
  {
    siret: "12345678902349",
    kind: "france-travail",
    email: "agency-group-2-email@gmail.com",
    codeSafir: "dt-safir-code",
    departments: ["86", "17", "16"],
    name: "DT vienne",
    scope: "direction-territoriale",
    agencyIds: ["test-agency-3-back", "test-agency-4-back"],
    ccEmails: ["fake-email3@gmail.com", "fake-email4@gmail.com"],
  },
];

type AgencyGroupBySiret = {
  [siret: string]: AgencyGroup;
};

export class InMemoryAgencyGroupRepository implements AgencyGroupRepository {
  #agencyGroups: AgencyGroupBySiret = {};

  constructor(agencyGroupList: AgencyGroup[] = testAgencyGroups) {
    agencyGroupList.forEach((agencyGroup) => {
      this.#agencyGroups[agencyGroup.siret] = agencyGroup;
    });
  }

  public async getByCodeSafir(
    codeSafir: CodeSafir,
  ): Promise<AgencyGroup | undefined> {
    return values(this.#agencyGroups).find(
      (agency) => agency.codeSafir === codeSafir,
    );
  }
  public set agencyGroups(agencyGroups: AgencyGroup[]) {
    this.#agencyGroups = agencyGroups.reduce(
      (acc, agencyGroup) => ({
        ...acc,
        [agencyGroup.siret]: agencyGroup,
      }),
      {} as AgencyGroupBySiret,
    );
  }
}
