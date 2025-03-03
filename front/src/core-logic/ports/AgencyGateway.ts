import { Observable } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  InclusionConnectedUser,
  ListAgencyOptionsRequestDto,
  ProConnectJwt,
  UpdateAgencyStatusParams,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";

export interface AgencyGateway {
  addAgency$(agency: CreateAgencyDto): Observable<void>;
  createUserForAgency$(
    params: UserParamsForAgency,
    token: ProConnectJwt,
  ): Observable<InclusionConnectedUser>;
  getAgencyById$(
    agencyId: AgencyId,
    token: ProConnectJwt,
  ): Observable<AgencyDto>;
  getAgencyUsers$(
    agencyId: AgencyId,
    token: ProConnectJwt,
  ): Observable<InclusionConnectedUser[]>;
  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto>;
  listAgencyOptionsByFilter$(
    filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]>;
  listAgencyOptionsNeedingReview$(
    adminToken: ProConnectJwt,
  ): Observable<AgencyOption[]>;
  updateAgency$(
    agencyDto: AgencyDto,
    adminToken: ProConnectJwt,
  ): Observable<void>;
  updateUserAgencyRight$(
    params: UserParamsForAgency,
    token: ProConnectJwt,
  ): Observable<void>;
  removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: ProConnectJwt,
  ): Observable<void>;
  validateOrRejectAgency$(
    adminToken: ProConnectJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void>;
}
