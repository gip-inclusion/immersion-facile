import { from, type Observable } from "rxjs";
import type {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  AgencyRoutes,
  ConnectedUser,
  ConnectedUserJwt,
  CreateAgencyDto,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { match, P } from "ts-pattern";

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

  public createUserForAgency$(
    params: UserParamsForAgency,
    token: string,
  ): Observable<ConnectedUser> {
    return from(
      this.httpClient
        .createUserForAgency({
          body: params,
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: ConnectedUserJwt,
  ): Observable<AgencyDto> {
    return from(
      this.httpClient
        .getAgencyById({
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

  getAgencyById$(
    agencyId: AgencyId,
    token: ConnectedUserJwt,
  ): Observable<AgencyDto> {
    return from(
      this.httpClient
        .getAgencyById({
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
    token: ConnectedUserJwt,
  ): Observable<ConnectedUser[]> {
    return from(
      this.httpClient
        .getAgencyUsersByAgencyId({
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
    adminToken: ConnectedUserJwt,
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
    adminToken: ConnectedUserJwt,
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
    token: ConnectedUserJwt,
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
            .with({ status: 201 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
  ): Observable<void> {
    return from(
      this.httpClient
        .registerAgenciesToUser({
          headers: { authorization: token },
          body: agencyIds,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public removeUserFromAgency$(
    params: WithAgencyIdAndUserId,
    token: string,
  ): Observable<void> {
    return from(
      this.httpClient
        .removeUserFromAgency({
          headers: { authorization: token },
          urlParams: params,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public async validateOrRejectAgency(
    adminToken: ConnectedUserJwt,
    { id, ...rest }: UpdateAgencyStatusParams,
  ): Promise<void> {
    await this.httpClient.updateAgencyStatus({
      body: rest,
      headers: { authorization: adminToken },
      urlParams: { agencyId: id },
    });
  }

  public validateOrRejectAgency$(
    adminToken: ConnectedUserJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(
      this.validateOrRejectAgency(adminToken, updateAgencyStatusParams),
    );
  }
}
