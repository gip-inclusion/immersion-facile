import { Observable } from "rxjs";
import {
  ApiConsumer,
  ApiConsumerJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  GetUsersFilters,
  InclusionConnectJwt,
  InclusionConnectedUser,
  NotificationsByKind,
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
    token: InclusionConnectJwt,
  ) => Observable<EstablishmentBatchReport>;

  createUserForAgency$(
    params: UserParamsForAgency,
    token: InclusionConnectJwt,
  ): Observable<InclusionConnectedUser>;

  getDashboardUrl$: (
    params: GetDashboardParams,
    token: InclusionConnectJwt,
  ) => Observable<DashboardUrlAndName>;
  getInclusionConnectedUsersToReview$: (
    token: InclusionConnectJwt,
    filters: WithUserFilters,
  ) => Observable<InclusionConnectedUser[]>;
  updateFeatureFlags$: (
    params: SetFeatureFlagParam,
    adminToken: InclusionConnectJwt,
  ) => Observable<void>;
  getAllApiConsumers$: (
    adminToken: InclusionConnectJwt,
  ) => Observable<ApiConsumer[]>;

  getLastNotifications$(
    token: InclusionConnectJwt,
  ): Observable<NotificationsByKind>;

  updateUserRoleForAgency$(
    params: UserParamsForAgency,
    token: InclusionConnectJwt,
  ): Observable<void>;

  removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: InclusionConnectJwt,
  ): Observable<void>;

  rejectUserForAgency$(
    params: RejectIcUserRoleForAgencyParams,
    token: InclusionConnectJwt,
  ): Observable<void>;

  saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: InclusionConnectJwt,
  ): Observable<ApiConsumerJwt | undefined>;

  listUsers$(
    params: GetUsersFilters,
    token: InclusionConnectJwt,
  ): Observable<UserInList[]>;

  getIcUser$(
    params: { userId: UserId },
    token: InclusionConnectJwt,
  ): Observable<InclusionConnectedUser>;
}
