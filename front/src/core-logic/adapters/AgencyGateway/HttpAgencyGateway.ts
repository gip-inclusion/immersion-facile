import { Observable, from } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  AgencyRoutes,
  CreateAgencyDto,
  InclusionConnectJwt,
  InclusionConnectedUser,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  UserParamsForAgency,
  WithAgencyId,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { match } from "ts-pattern";

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: HttpClient<AgencyRoutes>) {}

  public addAgency$(agency: CreateAgencyDto): Observable<void> {
    return from(
      this.httpClient.addAgency({ body: agency }).then((response) =>
        match(response)
          .with({ status: 200 }, () => undefined)
          .with({ status: 404 }, logBodyAndThrow)
          .with({ status: 409 }, logBodyAndThrow)
          .otherwise(otherwiseThrow),
      ),
    );
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: InclusionConnectJwt,
  ): Observable<AgencyDto> {
    return from(
      this.httpClient
        .getAgencyAdminById({
          urlParams: { agencyId },
          headers: { authorization: adminToken },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  getAgencyForDashboardById$(
    agencyId: AgencyId,
    token: InclusionConnectJwt,
  ): Observable<AgencyDto> {
    return from(
      this.httpClient
        .getAgencyByIdForDashboard({
          urlParams: { agencyId },
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .otherwise(otherwiseThrow),
        ),
    );
  }
  getAgencyUsers$(
    agencyId: AgencyId,
    token: InclusionConnectJwt,
  ): Observable<InclusionConnectedUser[]> {
    return from(
      this.httpClient
        .getAgencyUsersByAgencyIdForDashboard({
          urlParams: { agencyId },
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getAgencyPublicInfoById$({
    agencyId,
  }: WithAgencyId): Observable<AgencyPublicDisplayDto> {
    return from(
      this.httpClient
        .getAgencyPublicInfoById({ queryParams: { agencyId } })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return from(
      this.httpClient.getImmersionFacileAgencyId().then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .otherwise(otherwiseThrow),
      ),
    );
  }

  public listAgencyOptionsByFilter$(
    filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]> {
    return from(
      this.httpClient
        .getAgencyOptionsByFilter({ queryParams: filter })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  // TODO Mieux identifier l'admin

  public listAgencyOptionsNeedingReview$(
    adminToken: InclusionConnectJwt,
  ): Observable<AgencyOption[]> {
    return from(
      this.httpClient
        .listAgenciesOptionsWithStatus({
          queryParams: { status: "needsReview" },
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

  public updateAgency$(
    agencyDto: AgencyDto,
    adminToken: InclusionConnectJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateAgency({
          body: agencyDto,
          headers: { authorization: adminToken },
          urlParams: { agencyId: agencyDto.id },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 401 }, logBodyAndThrow)
            .with({ status: 409 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public updateUserAgencyRight$(
    params: UserParamsForAgency,
    token: InclusionConnectJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateUserRoleForAgency({
          headers: { authorization: token },
          urlParams: {
            agencyId: params.agencyId,
          },
          body: params,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, logBodyAndThrow)
            .with({ status: 401 }, logBodyAndThrow)
            .with({ status: 404 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public async validateOrRejectAgency(
    adminToken: InclusionConnectJwt,
    { id, ...rest }: UpdateAgencyStatusParams,
  ): Promise<void> {
    await this.httpClient.updateAgencyStatus({
      body: rest,
      headers: { authorization: adminToken },
      urlParams: { agencyId: id },
    });
  }

  public validateOrRejectAgency$(
    adminToken: InclusionConnectJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(
      this.validateOrRejectAgency(adminToken, updateAgencyStatusParams),
    );
  }
}
