import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  GetDashboardParams,
  UserAndPassword,
} from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  getDashboardUrl$: (
    params: GetDashboardParams,
    token: AdminToken,
  ) => Observable<AbsoluteUrl>;
}
