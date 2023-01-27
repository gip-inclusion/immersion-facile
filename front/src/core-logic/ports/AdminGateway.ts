import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  getDashboardUrl$: (
    params: GetDashboardParams,
    token: AdminToken,
  ) => Observable<AbsoluteUrl>;
  addEstablishmentBatch$: (
    establishmentBatch: FormEstablishmentBatchDto,
    token: AdminToken,
  ) => Observable<void>;
}
