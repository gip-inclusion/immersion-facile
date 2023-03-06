import { Observable } from "rxjs";
import {
  BackOfficeJwt,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  AgencyStatus,
  CreateAgencyDto,
  DepartmentCode,
  ExtractFromExisting,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";

export type WithAgencyStatus = { status: AgencyStatus };
export type ActiveOrRejectedStatus = ExtractFromExisting<
  AgencyStatus,
  "active" | "rejected"
>;
export type WithActiveOrRejectedStatus = { status: ActiveOrRejectedStatus };

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;
  listImmersionAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;

  listMiniStageAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;
  listImmersionWithoutPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;
  listImmersionOnlyPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;

  listAgenciesNeedingReview$(
    adminToken: BackOfficeJwt,
  ): Observable<AgencyOption[]>;

  validateOrRejectAgency$(
    adminToken: BackOfficeJwt,
    agencyId: AgencyId,
    status: ActiveOrRejectedStatus,
  ): Observable<void>;

  getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: BackOfficeJwt,
  ): Observable<AgencyDto | undefined>;

  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto>;

  listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]>;
  getImmersionFacileAgencyId$(): Observable<AgencyId | undefined>;
  updateAgency$(
    agencyDto: AgencyDto,
    adminToken: BackOfficeJwt,
  ): Observable<void>;
}
