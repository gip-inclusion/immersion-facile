import { Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared";
import { AbsoluteUrl } from "shared";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  metabaseAgencyEmbed: (token: AdminToken) => Observable<AbsoluteUrl>;
  getDashboardConventionUrl: (token: AdminToken) => Observable<AbsoluteUrl>;
}
