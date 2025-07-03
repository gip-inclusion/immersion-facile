import type { Observable } from "rxjs";
import type {
  ApiConsumer,
  ApiConsumerJwt,
  ConnectedUser,
  ConnectedUserJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  GetUsersFilters,
  NotificationsByKind,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
  UserId,
  UserParamsForAgency,
  UserWithNumberOfAgencies,
  WithAgencyIdAndUserId,
  WithUserFilters,
} from "shared";

export interface AdminGateway {
  addEstablishmentBatch$: (
    establishmentBatch: FormEstablishmentBatchDto,
    token: ConnectedUserJwt,
  ) => Observable<EstablishmentBatchReport>;

  createUserForAgency$(
    params: UserParamsForAgency,
    token: ConnectedUserJwt,
  ): Observable<ConnectedUser>;

  getDashboardUrl$: (
    params: GetDashboardParams,
    token: ConnectedUserJwt,
  ) => Observable<DashboardUrlAndName>;
  getConnectedUsersToReview$: (
    token: ConnectedUserJwt,
    filters: WithUserFilters,
  ) => Observable<ConnectedUser[]>;
  updateFeatureFlags$: (
    params: SetFeatureFlagParam,
    adminToken: ConnectedUserJwt,
  ) => Observable<void>;
  getAllApiConsumers$: (
    adminToken: ConnectedUserJwt,
  ) => Observable<ApiConsumer[]>;

  getLastNotifications$(
    token: ConnectedUserJwt,
  ): Observable<NotificationsByKind>;

  updateUserRoleForAgency$(
    params: UserParamsForAgency,
    token: ConnectedUserJwt,
  ): Observable<void>;

  removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: ConnectedUserJwt,
  ): Observable<void>;

  rejectUserForAgency$(
    params: RejectIcUserRoleForAgencyParams,
    token: ConnectedUserJwt,
  ): Observable<void>;

  saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: ConnectedUserJwt,
  ): Observable<ApiConsumerJwt | undefined>;

  listUsers$(
    params: GetUsersFilters,
    token: ConnectedUserJwt,
  ): Observable<UserWithNumberOfAgencies[]>;

  getIcUser$(
    params: { userId: UserId },
    token: ConnectedUserJwt,
  ): Observable<ConnectedUser>;
}
