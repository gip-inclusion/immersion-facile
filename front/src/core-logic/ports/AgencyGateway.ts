import { Observable } from "rxjs";
import {
  ActiveOrRejectedStatus,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  BackOfficeJwt,
  CreateAgencyDto,
  DepartmentCode,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";
import { agencyGateway } from "src/config/dependencies";

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

  getFilteredAgencies(filter: ListAgenciesRequestDto): Promise<AgencyOption[]>;
}

export const conventionAgenciesRetriever = ({
  internshipKind,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): ((departmentCode: DepartmentCode) => Promise<AgencyOption[]>) => {
  if (internshipKind === "mini-stage-cci")
    return (departmentCode) =>
      agencyGateway.listMiniStageAgencies(departmentCode);
  if (shouldListAll)
    return (departmentCode) =>
      agencyGateway.listImmersionAgencies(departmentCode);
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? (departmentCode) =>
        agencyGateway.listImmersionOnlyPeAgencies(departmentCode)
    : (departmentCode) => agencyGateway.listImmersionAgencies(departmentCode);
};
