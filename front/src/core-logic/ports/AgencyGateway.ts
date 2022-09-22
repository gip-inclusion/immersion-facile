import { Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  ConventionViewAgencyDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { DepartmentCode } from "shared/src/address/address.dto";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;
  listAgencies(departmentCode: DepartmentCode): Promise<AgencyIdAndName[]>;
  listNonPeAgencies(departmentCode: DepartmentCode): Promise<AgencyIdAndName[]>;
  listPeAgencies(departmentCode: DepartmentCode): Promise<AgencyIdAndName[]>;
  listAgenciesNeedingReview(adminToken: AdminToken): Promise<AgencyDto[]>;
  validateAgency(adminToken: AdminToken, agencyId: AgencyId): Promise<void>;
  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  listAgencies$(
    departmentCode: DepartmentCode,
  ): Observable<ConventionViewAgencyDto[]>;
  getImmersionFacileAgencyId$(): Observable<AgencyId | false>;
}
