import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  DashboardName,
  UserAndPassword,
} from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  metabaseAgencyEmbed: (token: AdminToken) => Observable<AbsoluteUrl>;
  getDashboardUrl$: (
    dashboardName: DashboardName,
    token: AdminToken,
  ) => Observable<AbsoluteUrl>;
}
