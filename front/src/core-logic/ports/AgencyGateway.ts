import type { Observable } from "rxjs";
import type {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  ConnectedUser,
  ConnectedUserJwt,
  CreateAgencyDto,
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
  ): Observable<ConnectedUser>;
  getAgencyById$(
    agencyId: AgencyId,
    token: ConnectedUserJwt,
  ): Observable<AgencyDto>;
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
  registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
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
