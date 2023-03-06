import { createTargets, CreateTargets, HttpClient, Target } from "http-client";
import { from, Observable } from "rxjs";
import {
  AdminToken,
  agenciesIdAndNameSchema,
  agenciesRoute,
  AgencyDto,
  AgencyId,
  agencyIdResponseSchema,
  agencyImmersionFacileIdRoute,
  AgencyOption,
  AgencyPublicDisplayDto,
  agencyPublicDisplaySchema,
  agencyPublicInfoByIdRoute,
  agencySchema,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
  WithAuthorization,
} from "shared";
import {
  ActiveOrRejectedStatus,
  AgencyGateway,
  WithActiveOrRejectedStatus,
  WithAgencyStatus,
} from "src/core-logic/ports/AgencyGateway";

export type AgencyTargets = CreateTargets<{
  getAgencyAdminById: Target<
    void,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  updateAgencyStatus: Target<
    WithActiveOrRejectedStatus,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  updateAgency: Target<
    AgencyDto,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  getImmersionFacileAgencyId: Target;
  addAgency: Target<CreateAgencyDto>;
  getAgencyPublicInfoById: Target<void, WithAgencyId>;
  listAgenciesNeedingReview: Target<void, WithAgencyStatus, WithAuthorization>;
  getFilteredAgencies: Target<void, ListAgenciesRequestDto>;
}>;

export const agencyTargets = createTargets<AgencyTargets>({
  getAgencyAdminById: {
    method: "GET",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  updateAgencyStatus: {
    method: "PATCH",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  updateAgency: {
    method: "PUT",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  getImmersionFacileAgencyId: {
    method: "GET",
    url: `/${agencyImmersionFacileIdRoute}`,
  },
  addAgency: {
    method: "POST",
    url: `/${agenciesRoute}`,
  },
  getAgencyPublicInfoById: {
    method: "GET",
    url: `/${agencyPublicInfoByIdRoute}`,
  },
  listAgenciesNeedingReview: {
    method: "GET",
    url: `/admin/${agenciesRoute}`,
  },
  getFilteredAgencies: {
    method: "GET",
    url: `/${agenciesRoute}`,
  },
});

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: HttpClient<AgencyTargets>) {}

  getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return from(
      this.httpClient
        .getImmersionFacileAgencyId()
        .then(({ responseBody }) => agencyIdResponseSchema.parse(responseBody)),
    );
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Observable<AgencyDto> {
    return from(this.getAdminAgencyById(agencyId, adminToken));
  }

  public updateAgency$(
    agencyDto: AgencyDto,
    adminToken: AdminToken,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateAgency({
          body: agencyDto,
          headers: { authorization: adminToken },
          urlParams: { agencyId: agencyDto.id },
        })
        .then(() => {
          /* void if success */
        }),
    );
  }

  private getAdminAgencyById(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Promise<AgencyDto> {
    return this.httpClient
      .getAgencyAdminById({
        urlParams: { agencyId },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => agencySchema.parse(responseBody));
  }

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await this.httpClient.addAgency({ body: createAgencyParams });
  }

  public getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    return this.httpClient
      .getAgencyPublicInfoById({ queryParams: withAgencyId })
      .then(({ responseBody }) =>
        agencyPublicDisplaySchema.parse(responseBody),
      );
  }

  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return from(this.getAgencyPublicInfoById(agencyId));
  }

  public listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return from(this.getFilteredAgencies(filter));
  }

  public listAgenciesNeedingReview$(
    adminToken: AdminToken,
  ): Observable<AgencyOption[]> {
    return from(this.listAgenciesNeedingReview(adminToken));
  }

  public listImmersionAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "miniStageExcluded",
    };
    return this.getFilteredAgencies(request);
  }

  public listImmersionOnlyPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "immersionPeOnly",
    };
    return this.getFilteredAgencies(request);
  }

  public listImmersionWithoutPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "immersionWithoutPe",
    };
    return this.getFilteredAgencies(request);
  }

  listMiniStageAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "miniStageOnly",
    };
    return this.getFilteredAgencies(request);
  }

  // TODO Mieux identifier l'admin
  private listAgenciesNeedingReview(
    adminToken: AdminToken,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .listAgenciesNeedingReview({
        queryParams: { status: "needsReview" },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => agenciesIdAndNameSchema.parse(responseBody));
  }

  // TODO Mieux identifier l'admin
  public async validateOrRejectAgency(
    adminToken: AdminToken,
    agencyId: AgencyId,
    status: ActiveOrRejectedStatus,
  ): Promise<void> {
    await this.httpClient.updateAgencyStatus({
      body: { status },
      headers: { authorization: adminToken },
      urlParams: { agencyId },
    });
  }

  public validateOrRejectAgency$(
    adminToken: AdminToken,
    agencyId: AgencyId,
    status: ActiveOrRejectedStatus,
  ): Observable<void> {
    return from(this.validateOrRejectAgency(adminToken, agencyId, status));
  }

  private getFilteredAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .getFilteredAgencies({ queryParams: request })
      .then(({ responseBody }) => agenciesIdAndNameSchema.parse(responseBody));
  }
}
