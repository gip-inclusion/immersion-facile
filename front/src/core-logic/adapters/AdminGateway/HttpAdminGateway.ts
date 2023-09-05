import { from, map, Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminRoutes,
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  SetFeatureFlagParam,
  UserAndPassword,
} from "shared";
import { HttpClient } from "shared-routes";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  public updateFeatureFlags$ = (
    params: SetFeatureFlagParam,
    token: BackOfficeJwt,
  ): Observable<void> =>
    from(
      this.httpClient.updateFeatureFlags({
        body: params,
        headers: { authorization: token },
      }),
    ).pipe(map(() => undefined));

  constructor(private readonly httpClient: HttpClient<AdminRoutes>) {}

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
        .then(({ body }) => body),
    );
  }

  public getAllApiConsumers$(
    adminToken: BackOfficeJwt,
  ): Observable<ApiConsumer[]> {
    return from(
      this.httpClient
        .getAllApiConsumers({
          headers: { authorization: adminToken },
        })
        .then((response) => {
          if (response.status === 200) return response.body;
          throw new Error(JSON.stringify(response.body));
        }),
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
        .then((response) => {
          if (response.status === 200) return response.body;
          throw new Error(JSON.stringify(response.body));
        }),
    );
  }

  public getInclusionConnectedUsersToReview$(
    token: BackOfficeJwt,
  ): Observable<InclusionConnectedUser[]> {
    return from(
      this.httpClient
        .getInclusionConnectedUsers({
          queryParams: { agencyRole: "toReview" },
          headers: { authorization: token },
        })
        .then((response) => {
          if (response.status === 200) return response.body;
          throw new Error(JSON.stringify(response.body));
        }),
    );
  }

  public getLastNotifications$(token: BackOfficeJwt) {
    return from(
      this.httpClient
        .getLastNotifications({ headers: { authorization: token } })
        .then(({ body }) => body),
    );
  }

  public login$(userAndPassword: UserAndPassword): Observable<BackOfficeJwt> {
    return from(
      this.httpClient.login({ body: userAndPassword }).then((response) => {
        if (response.status === 200) return response.body;
        throw new Error(JSON.stringify(response.body));
      }),
    );
  }

  public saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: BackOfficeJwt,
  ): Observable<ApiConsumerJwt> {
    return from(
      this.httpClient
        .saveApiConsumer({
          body: apiConsumer,
          headers: { authorization: adminToken },
        })
        .then((response) => {
          if (response.status === 200) return response.body;
          throw new Error(JSON.stringify(response.body));
        }),
    );
  }

  public updateUserRoleForAgency$(
    params: IcUserRoleForAgencyParams,
    token: string,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateUserRoleForAgency({
          body: params,
          headers: { authorization: token },
        })
        .then((response) => {
          if (response.status === 201) return;
          throw new Error(JSON.stringify(response.body));
        }),
    );
  }
}
