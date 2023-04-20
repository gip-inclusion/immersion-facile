import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  InclusionConnectedUser,
  RegisterAgencyWithRoleToUserDto,
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
  getInclusionConnectedUsersToReview$: (
    token: BackOfficeJwt,
  ) => Observable<InclusionConnectedUser[]>;
  updateAgencyRoleForUser$(
    params: RegisterAgencyWithRoleToUserDto,
    token: BackOfficeJwt,
  ): Observable<void>;
}
