import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { AdminToken, UserAndPassword } from "shared/src/admin/admin.dto";
import { adminTokenSchema } from "shared/src/admin/admin.schema";
import {
  adminLogin,
  dashboardAgency,
  conventionsRoute,
} from "shared/src/routes";
import { AbsoluteUrl, absoluteUrlSchema } from "shared/src/AbsoluteUrl";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public login(userAndPassword: UserAndPassword): Observable<AdminToken> {
    return from(
      this.httpClient.post<unknown>(`/admin/${adminLogin}`, userAndPassword),
    ).pipe(map(({ data }): AdminToken => adminTokenSchema.parse(data)));
  }

  // TODO Do we want to create a specific adapter ?
  public metabaseAgencyEmbed(token: AdminToken): Observable<AbsoluteUrl> {
    return from(
      this.httpClient.get<unknown>(`/admin/${dashboardAgency}`, {
        headers: {
          authorization: token,
        },
      }),
    ).pipe(map(({ data }): AbsoluteUrl => absoluteUrlSchema.parse(data)));
  }

  // TODO Do we want to create a specific adapter ?
  public getDashboardConventionUrl(token: AdminToken): Observable<AbsoluteUrl> {
    return from(
      this.httpClient.get<unknown>(`/admin/${conventionsRoute}`, {
        headers: {
          authorization: token,
        },
      }),
    ).pipe(map(({ data }): AbsoluteUrl => absoluteUrlSchema.parse(data)));
  }
}
