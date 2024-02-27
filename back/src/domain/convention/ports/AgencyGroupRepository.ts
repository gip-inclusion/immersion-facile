import { AgencyGroup, CodeSafir } from "shared";

export interface AgencyGroupRepository {
  getByCodeSafir(codeSafir: CodeSafir): Promise<AgencyGroup | undefined>;

  // exemple of method for delegation use
  // getGroupsContainingAgency(
  //   agency: AgencyDto,
  //   scope: AgencyGroupScope,
  // ): Promise<AgencyGroup[]>;
}
