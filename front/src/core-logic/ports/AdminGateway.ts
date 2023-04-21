import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
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
  updateUserRoleForAgency$(
    params: IcUserRoleForAgencyParams,
    token: BackOfficeJwt,
  ): Observable<void>;
}
