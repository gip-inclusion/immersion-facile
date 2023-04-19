import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AgencyDto,
  AgencyId,
  AgencyRole,
  AuthenticatedUser,
  AuthenticatedUserId,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<BackOfficeJwt>;
  getDashboardUrl$: (
    params: GetDashboardParams,
    token: BackOfficeJwt,
  ) => Observable<AbsoluteUrl>;
  addEstablishmentBatch$: (
    establishmentBatch: FormEstablishmentBatchDto,
    token: BackOfficeJwt,
  ) => Observable<EstablishmentBatchReport>;
  getAgencyUsersToReview$: (
    token: BackOfficeJwt,
  ) => Observable<AuthenticatedUser[]>;
  getAgenciesToReviewForUser$(
    userId: AuthenticatedUserId,
    token: BackOfficeJwt,
  ): Observable<AgencyDto[]>;
  updateAgencyRoleForUser$(
    agencyId: AgencyId,
    role: AgencyRole,
    userId: AuthenticatedUserId,
    token: BackOfficeJwt,
  ): Observable<void>;
}
