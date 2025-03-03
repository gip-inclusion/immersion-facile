import { Observable } from "rxjs";
import {
  ApiConsumer,
  ApiConsumerJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  GetUsersFilters,
  InclusionConnectedUser,
  NotificationsByKind,
  ProConnectJwt,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
  UserId,
  UserInList,
  UserParamsForAgency,
  WithAgencyIdAndUserId,
  WithUserFilters,
} from "shared";

export interface AdminGateway {
  addEstablishmentBatch$: (
    establishmentBatch: FormEstablishmentBatchDto,
    token: ProConnectJwt,
  ) => Observable<EstablishmentBatchReport>;

  createUserForAgency$(
    params: UserParamsForAgency,
    token: ProConnectJwt,
  ): Observable<InclusionConnectedUser>;

  getDashboardUrl$: (
    params: GetDashboardParams,
    token: ProConnectJwt,
  ) => Observable<DashboardUrlAndName>;
  getInclusionConnectedUsersToReview$: (
    token: ProConnectJwt,
    filters: WithUserFilters,
  ) => Observable<InclusionConnectedUser[]>;
  updateFeatureFlags$: (
    params: SetFeatureFlagParam,
    adminToken: ProConnectJwt,
  ) => Observable<void>;
  getAllApiConsumers$: (adminToken: ProConnectJwt) => Observable<ApiConsumer[]>;

  getLastNotifications$(token: ProConnectJwt): Observable<NotificationsByKind>;

  updateUserRoleForAgency$(
    params: UserParamsForAgency,
    token: ProConnectJwt,
  ): Observable<void>;

  removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: ProConnectJwt,
  ): Observable<void>;

  rejectUserForAgency$(
    params: RejectIcUserRoleForAgencyParams,
    token: ProConnectJwt,
  ): Observable<void>;

  saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: ProConnectJwt,
  ): Observable<ApiConsumerJwt | undefined>;

  listUsers$(
    params: GetUsersFilters,
    token: ProConnectJwt,
  ): Observable<UserInList[]>;

  getIcUser$(
    params: { userId: UserId },
    token: ProConnectJwt,
  ): Observable<InclusionConnectedUser>;
}
