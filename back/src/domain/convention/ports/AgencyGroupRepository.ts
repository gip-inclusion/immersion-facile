import { AgencyGroup, CodeSafir } from "shared";

export interface AgencyGroupRepository {
  getByCodeSafir(codeSafir: CodeSafir): Promise<AgencyGroup | undefined>;
  // getGroupsContainingAgency(
  //   agency: AgencyDto,
  //   scope: AgencyGroupScope,
  // ): Promise<AgencyGroup[]>;
}
