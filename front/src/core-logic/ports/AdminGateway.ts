import { Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";

export interface AdminGateway {
  login: (params: UserAndPassword) => Observable<AdminToken>;
  metabaseAgencyEmbed: (token: AdminToken) => Observable<AbsoluteUrl>;
  getDashboardConventionUrl: (token: AdminToken) => Observable<AbsoluteUrl>;
}
