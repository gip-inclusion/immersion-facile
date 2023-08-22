import { Observable } from "rxjs";
import {
  AbsoluteUrl,
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
  getLastNotifications$(token: BackOfficeJwt): Observable<NotificationsByKind>;

  login$: (params: UserAndPassword) => Observable<BackOfficeJwt>;

  updateFeatureFlags$: (
    params: SetFeatureFlagParam,
    adminToken: BackOfficeJwt,
  ) => Observable<void>;
  updateUserRoleForAgency$(
    params: IcUserRoleForAgencyParams,
    token: BackOfficeJwt,
  ): Observable<void>;
}
