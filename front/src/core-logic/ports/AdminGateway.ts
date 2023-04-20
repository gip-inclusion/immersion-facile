import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AgencyDto,
  AuthenticatedUser,
  AuthenticatedUserId,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";
import { RegisterAgencyWithRoleToUserPayload } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";

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
    params: RegisterAgencyWithRoleToUserPayload,
    token: BackOfficeJwt,
  ): Observable<void>;
}
