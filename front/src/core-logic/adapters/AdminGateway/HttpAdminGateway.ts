import { from, Observable } from "rxjs";
import { match, P } from "ts-pattern";
import {
  AbsoluteUrl,
  AdminRoutes,
  ApiConsumer,
  ApiConsumerJwt,
  BackOfficeJwt,
  createApiConsumerParamsFromApiConsumer,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
  UserAndPassword,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  public updateFeatureFlags$ = (
    params: SetFeatureFlagParam,
    token: BackOfficeJwt,
  ): Observable<void> =>
    from(
      this.httpClient
        .updateFeatureFlags({
          body: params,
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 201 }, () => undefined)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );

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
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, logBodyAndThrow)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: P.union(400, 401) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getLastNotifications$(token: BackOfficeJwt) {
    return from(
      this.httpClient
        .getLastNotifications({ headers: { authorization: token } })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public login$(userAndPassword: UserAndPassword): Observable<BackOfficeJwt> {
    return from(
      this.httpClient.login({ body: userAndPassword }).then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .with({ status: 403 }, logBodyAndThrow)
          .otherwise(otherwiseThrow),
      ),
    );
  }

  public rejectUserForAgency$(
    params: RejectIcUserRoleForAgencyParams,
    token: string,
  ): Observable<void> {
    return from(
      this.httpClient
        .rejectIcUserForAgency({
          body: params,
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 201 }, () => undefined)
            .with({ status: P.union(401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public saveApiConsumer$(
    apiConsumer: ApiConsumer,
    adminToken: BackOfficeJwt,
  ): Observable<ApiConsumerJwt | undefined> {
    return from(
      this.httpClient
        .saveApiConsumer({
          body: createApiConsumerParamsFromApiConsumer(apiConsumer),
          headers: { authorization: adminToken },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body || undefined)
            .with({ status: P.union(401) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 201 }, () => undefined)
            .with({ status: P.union(401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
