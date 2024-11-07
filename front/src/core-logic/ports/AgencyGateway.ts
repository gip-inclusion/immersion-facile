import { Observable } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  InclusionConnectJwt,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  WithAgencyId,
} from "shared";

export interface AgencyGateway {
  addAgency$(agency: CreateAgencyDto): Observable<void>;
  getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: InclusionConnectJwt,
  ): Observable<AgencyDto | undefined>;
  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto>;
  listAgencyOptionsByFilter$(
    filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]>;
  listAgencyOptionsNeedingReview$(
    adminToken: InclusionConnectJwt,
  ): Observable<AgencyOption[]>;
  updateAgency$(
    agencyDto: AgencyDto,
    adminToken: InclusionConnectJwt,
  ): Observable<void>;
  validateOrRejectAgency$(
    adminToken: InclusionConnectJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void>;
}
