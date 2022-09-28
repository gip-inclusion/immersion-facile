import { Observable } from "rxjs";
import { AdminToken } from "shared";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared";
import { DepartmentCode } from "shared";

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
  listAgencies$(departmentCode: DepartmentCode): Observable<AgencyIdAndName[]>;
  getImmersionFacileAgencyId$(): Observable<AgencyId | false>;
}
