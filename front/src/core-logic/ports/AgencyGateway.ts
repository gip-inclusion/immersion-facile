import { Observable } from "rxjs";
import {
  AdminToken,
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;
  listAgenciesByDepartmentCode(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]>;
  listNonPeAgencies(departmentCode: DepartmentCode): Promise<AgencyIdAndName[]>;
  listPeAgencies(departmentCode: DepartmentCode): Promise<AgencyIdAndName[]>;
  listAgenciesNeedingReview(adminToken: AdminToken): Promise<AgencyDto[]>;
  validateAgency(adminToken: AdminToken, agencyId: AgencyId): Promise<void>;

  getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Observable<AgencyDto>;

  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyIdAndName[]>;
  getImmersionFacileAgencyId$(): Observable<AgencyId | false>;
}
