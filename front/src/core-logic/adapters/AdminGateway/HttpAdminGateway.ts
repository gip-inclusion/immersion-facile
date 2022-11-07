import { HttpClient } from "http-client";
import { from, Observable } from "rxjs";
import {
  AbsoluteUrl,
  absoluteUrlSchema,
  AdminTargets,
  AdminToken,
  adminTokenSchema,
  DashboardName,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: HttpClient<AdminTargets>) {}

  public login(userAndPassword: UserAndPassword): Observable<AdminToken> {
    return from(
      this.httpClient
        .login({ body: userAndPassword })
        .then(({ responseBody }) => adminTokenSchema.parse(responseBody)),
    );
  }

  // TODO Do we want to create a specific adapter ?
  public metabaseAgencyEmbed(token: AdminToken): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .metabaseAgency({ headers: { authorization: token } })
        .then(({ responseBody }) => absoluteUrlSchema.parse(responseBody)),
    );
  }

  // TODO Do we want to create a specific adapter ?
  public getDashboardUrl$(
    dashboardName: DashboardName,
    token: AdminToken,
  ): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getDashboardUrl({
          urlParams: { dashboardName },
          headers: {
            authorization: token,
          },
        })
        .then(({ responseBody }) => absoluteUrlSchema.parse(responseBody)),
    );
  }
}
