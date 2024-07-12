import { Observable, from } from "rxjs";
import {
  AdminRoutes,
  ApiConsumer,
  ApiConsumerJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectJwt,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  SetFeatureFlagParam,
  WithUserFilters,
  createApiConsumerParamsFromApiConsumer,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";
import { P, match } from "ts-pattern";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: HttpClient<AdminRoutes>) {}

  public addEstablishmentBatch$(
    establishmentBatch: FormEstablishmentBatchDto,
    token: InclusionConnectJwt,
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
    adminToken: InclusionConnectJwt,
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
    token: InclusionConnectJwt,
  ): Observable<DashboardUrlAndName> {
    return from(
      this.httpClient
        .getDashboardUrl({
          urlParams: { dashboardName: params.name },
          queryParams: {
            ...(params.name === "agencyForAdmin"
              ? { agencyId: params.agencyId }
              : {}),
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
    token: InclusionConnectJwt,
    filters: WithUserFilters,
  ): Observable<InclusionConnectedUser[]> {
    return from(
      this.httpClient
        .getInclusionConnectedUsers({
          queryParams: filters,
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

  public getLastNotifications$(token: InclusionConnectJwt) {
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
    adminToken: InclusionConnectJwt,
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

  public updateFeatureFlags$(
    params: SetFeatureFlagParam,
    token: InclusionConnectJwt,
  ): Observable<void> {
    return from(
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
