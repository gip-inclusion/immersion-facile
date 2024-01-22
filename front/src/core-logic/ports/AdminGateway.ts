import { Observable } from "rxjs";
import {
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
  UserAndPassword,
} from "shared";

export interface AdminGateway {
  addEstablishmentBatch$: (
    establishmentBatch: FormEstablishmentBatchDto,
    token: BackOfficeJwt,
  ) => Observable<EstablishmentBatchReport>;

  getDashboardUrl$: (
    params: GetDashboardParams,
    token: BackOfficeJwt,
  ) => Observable<DashboardUrlAndName>;
  getInclusionConnectedUsersToReview$: (
    token: BackOfficeJwt,
  ) => Observable<InclusionConnectedUser[]>;
  login$: (params: UserAndPassword) => Observable<BackOfficeJwt>;
  updateFeatureFlags$: (
    params: SetFeatureFlagParam,
    adminToken: BackOfficeJwt,
  ) => Observable<void>;
  getAllApiConsumers$: (adminToken: BackOfficeJwt) => Observable<ApiConsumer[]>;

  getLastNotifications$(token: BackOfficeJwt): Observable<NotificationsByKind>;

  updateUserRoleForAgency$(
    params: IcUserRoleForAgencyParams,
    token: BackOfficeJwt,
  ): Observable<void>;

  rejectUserForAgency$(
    params: RejectIcUserRoleForAgencyParams,
    token: BackOfficeJwt,
  ): Observable<void>;

  saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: BackOfficeJwt,
  ): Observable<ApiConsumerJwt | undefined>;
}
