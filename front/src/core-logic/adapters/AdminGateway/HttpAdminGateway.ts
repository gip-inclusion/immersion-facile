import { HttpClient } from "http-client";
import { from, Observable } from "rxjs";
import {
  AbsoluteUrl,
  absoluteUrlSchema,
  AdminTargets,
  adminTokenSchema,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: HttpClient<AdminTargets>) {}

  public login(userAndPassword: UserAndPassword): Observable<BackOfficeJwt> {
    return from(
      this.httpClient
        .login({ body: userAndPassword })
        .then(({ responseBody }) => adminTokenSchema.parse(responseBody)),
    );
  }

  public getDashboardUrl$(
    params: GetDashboardParams,
    token: BackOfficeJwt,
  ): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getDashboardUrl({
          urlParams: { dashboardName: params.name },
          queryParams: {
            ...(params.name === "agency" ? { agencyId: params.agencyId } : {}),
          },
          headers: {
            authorization: token,
          },
        })
        .then(({ responseBody }) => absoluteUrlSchema.parse(responseBody)),
    );
  }
  public addEstablishmentBatch$(
    establishmentBatch: FormEstablishmentBatchDto,
    token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return from(
      this.httpClient
        .addFormEstablishmentBatch({
          headers: {
            authorization: token,
          },
          body: establishmentBatch,
        })
        .then(({ responseBody }) => responseBody),
    );
  }
}
