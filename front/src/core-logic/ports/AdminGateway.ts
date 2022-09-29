import { Observable } from "rxjs";
import { AbsoluteUrl, AdminToken, UserAndPassword } from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  metabaseAgencyEmbed: (token: AdminToken) => Observable<AbsoluteUrl>;
  getDashboardConventionUrl: (token: AdminToken) => Observable<AbsoluteUrl>;
}
