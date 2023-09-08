import { from, Observable } from "rxjs";
import {
  ActiveOrRejectedStatus,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  AgencyRoutes,
  BackOfficeJwt,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";
import { HttpClient } from "shared-routes";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: HttpClient<AgencyRoutes>) {}

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await this.httpClient.addAgency({ body: createAgencyParams });
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: BackOfficeJwt,
  ): Observable<AgencyDto> {
    return from(
      this.httpClient
        .getAgencyAdminById({
          urlParams: { agencyId },
          headers: { authorization: adminToken },
        })
        .then(({ body }) => body),
    );
  }

  public getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    return this.httpClient
      .getAgencyPublicInfoById({ queryParams: withAgencyId })
      .then(({ body }) => body);
  }

  public getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return from(this.getAgencyPublicInfoById(agencyId));
  }

  public getFilteredAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .getFilteredAgencies({ queryParams: request })
      .then(({ body }) => body);
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return from(
      this.httpClient.getImmersionFacileAgencyId().then(({ body }) => body),
    );
  }

  public listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return from(this.getFilteredAgencies(filter));
  }

  // TODO Mieux identifier l'admin

  public listAgenciesNeedingReview$(
    adminToken: BackOfficeJwt,
  ): Observable<AgencyOption[]> {
    return from(
      this.httpClient
        .listAgenciesWithStatus({
          queryParams: { status: "needsReview" },
          headers: { authorization: adminToken },
        })
        .then((response) => {
          if (response.status === 200) return response.body;
          throw new Error(JSON.stringify(response.body));
        }),
    );
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

  public listMiniStageAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "miniStageOnly",
    };
    return this.getFilteredAgencies(request);
  }

  public updateAgency$(
    agencyDto: AgencyDto,
    adminToken: BackOfficeJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateAgency({
          body: agencyDto,
          headers: { authorization: adminToken },
          urlParams: { agencyId: agencyDto.id },
        })
        .then((response) => {
          if (response.status === 200) return;
          throw new Error(JSON.stringify(response.body));
        }),
    );
  }

  public async validateOrRejectAgency(
    adminToken: BackOfficeJwt,
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
    adminToken: BackOfficeJwt,
    agencyId: AgencyId,
    status: ActiveOrRejectedStatus,
  ): Observable<void> {
    return from(this.validateOrRejectAgency(adminToken, agencyId, status));
  }
}
