import type { Observable } from "rxjs";
import type {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  ConnectedUserJwt,
  CreateAgencyDto,
  InclusionConnectedUser,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";

export interface AgencyGateway {
  addAgency$(agency: CreateAgencyDto): Observable<void>;
  createUserForAgency$(
    params: UserParamsForAgency,
    token: ConnectedUserJwt,
  ): Observable<InclusionConnectedUser>;
  getAgencyById$(
    agencyId: AgencyId,
    token: ConnectedUserJwt,
  ): Observable<AgencyDto>;
  getAgencyUsers$(
    agencyId: AgencyId,
    token: ConnectedUserJwt,
  ): Observable<InclusionConnectedUser[]>;
  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto>;
  listAgencyOptionsByFilter$(
    filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]>;
  listAgencyOptionsNeedingReview$(
    adminToken: ConnectedUserJwt,
  ): Observable<AgencyOption[]>;
  updateAgency$(
    agencyDto: AgencyDto,
    adminToken: ConnectedUserJwt,
  ): Observable<void>;
  updateUserAgencyRight$(
    params: UserParamsForAgency,
    token: ConnectedUserJwt,
  ): Observable<void>;
  removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: ConnectedUserJwt,
  ): Observable<void>;
  validateOrRejectAgency$(
    adminToken: ConnectedUserJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void>;
}
