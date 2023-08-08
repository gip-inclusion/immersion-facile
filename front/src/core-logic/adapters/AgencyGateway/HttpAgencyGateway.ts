import { from, Observable } from "rxjs";
import {
  ActiveOrRejectedStatus,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  agencySchema,
  AgencyTargets,
  BackOfficeJwt,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";
import { HttpClient } from "http-client";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: HttpClient<AgencyTargets>) {}

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await this.httpClient.addAgency({ body: createAgencyParams });
  }

  private getAdminAgencyById(
    agencyId: AgencyId,
    adminToken: BackOfficeJwt,
  ): Promise<AgencyDto> {
    return this.httpClient
      .getAgencyAdminById({
        urlParams: { agencyId },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => agencySchema.parse(responseBody));
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: BackOfficeJwt,
  ): Observable<AgencyDto> {
    return from(this.getAdminAgencyById(agencyId, adminToken));
  }

  public getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    return this.httpClient
      .getAgencyPublicInfoById({ queryParams: withAgencyId })
      .then(({ responseBody }) => responseBody);
  }

  getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return from(this.getAgencyPublicInfoById(agencyId));
  }

  public getFilteredAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .getFilteredAgencies({ queryParams: request })
      .then(({ responseBody }) => responseBody);
  }

  getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return from(
      this.httpClient
        .getImmersionFacileAgencyId()
        .then(({ responseBody }) => responseBody),
    );
  }

  public listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return from(this.getFilteredAgencies(filter));
  }

  // TODO Mieux identifier l'admin
  private listAgenciesNeedingReview(
    adminToken: BackOfficeJwt,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .listAgenciesWithStatus({
        queryParams: { status: "needsReview" },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => responseBody);
  }

  public listAgenciesNeedingReview$(
    adminToken: BackOfficeJwt,
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
        .then(({ responseBody }) => responseBody),
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
