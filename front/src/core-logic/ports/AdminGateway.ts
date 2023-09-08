import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
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
  ) => Observable<AbsoluteUrl>;
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

  saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: BackOfficeJwt,
  ): Observable<ApiConsumerJwt | undefined>;
}
