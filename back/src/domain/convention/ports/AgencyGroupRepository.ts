import { AgencyDto, AgencyGroup, AgencyGroupScope, CodeSafir } from "shared";

export interface AgencyGroupRepository {
  getByCodeSafir(siret: CodeSafir): Promise<AgencyGroup | undefined>;
  getGroupsContainingAgency(
    agency: AgencyDto,
    scope: AgencyGroupScope,
  ): Promise<AgencyGroup[]>;
}
