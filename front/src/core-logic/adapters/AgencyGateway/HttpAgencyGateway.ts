import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import {
  AdminToken,
  agenciesIdAndNameSchema,
  agenciesRoute,
  agenciesSchema,
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  agencyIdResponseSchema,
  agencyImmersionFacileIdRoute,
  AgencyPublicDisplayDto,
  agencyPublicDisplaySchema,
  agencyPublicInfoByIdRoute,
  agencySchema,
  AgencyStatus,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  UpdateAgencyRequestDto,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  getImmersionFacileAgencyId$(): Observable<AgencyId | false> {
    return from(
      this.httpClient.get<unknown>(`/${agencyImmersionFacileIdRoute}`),
    ).pipe(
      map(({ data }) => {
        const agencyIdResponse = agencyIdResponseSchema.parse(data);
        return typeof agencyIdResponse === "string" ? agencyIdResponse : false;
      }),
    );
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Observable<AgencyDto> {
    return from(this.getAdminAgencyById(agencyId, adminToken));
  }

  private async getAdminAgencyById(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Promise<AgencyDto> {
    const response = await this.httpClient.get<unknown>(
      `/admin/${agenciesRoute}/${agencyId}`,
      {
        headers: { authorization: adminToken },
      },
    );
    return agencySchema.parse(response.data);
  }

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await this.httpClient.post<unknown>(
      `/${agenciesRoute}`,
      createAgencyParams,
    );
  }

  public async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/${agencyPublicInfoByIdRoute}`,
      {
        params: agencyId,
      },
    );
    const agencyPublicDisplayDto = agencyPublicDisplaySchema.parse(data);
    return agencyPublicDisplayDto;
  }

  public listAgenciesByDepartmentCode(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
    };
    return this.getFilteredAgencies(request);
  }

  public listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyIdAndName[]> {
    return from(this.getFilteredAgencies(filter));
  }

  public listPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      filter: "peOnly",
    };
    return this.getFilteredAgencies(request);
  }

  public listNonPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      filter: "peExcluded",
    };
    return this.getFilteredAgencies(request);
  }

  // TODO Mieux identifier l'admin
  public async listAgenciesNeedingReview(
    adminToken: AdminToken,
  ): Promise<AgencyDto[]> {
    const needsReviewStatus: AgencyStatus = "needsReview";
    const { data } = await this.httpClient.get<unknown>(
      `/admin/${agenciesRoute}`,
      {
        params: { status: needsReviewStatus },
        headers: { authorization: adminToken },
      },
    );
    const agenciesDto = agenciesSchema.parse(data);
    return agenciesDto;
  }

  // TODO Mieux identifier l'admin
  public async validateAgency(
    adminToken: AdminToken,
    agencyId: AgencyId,
  ): Promise<void> {
    const { id, ...validateAgencyParams }: UpdateAgencyRequestDto = {
      id: agencyId,
      status: "active",
    };
    await this.httpClient.patch<unknown>(
      `/admin/${agenciesRoute}/${agencyId}`,
      validateAgencyParams,
      { headers: { authorization: adminToken } },
    );
  }

  private async getFilteredAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyIdAndName[]> {
    const response = await this.httpClient.get<unknown>(`/${agenciesRoute}`, {
      params: request,
    });
    const agencies = agenciesIdAndNameSchema.parse(response.data);
    return agencies;
  }
}
