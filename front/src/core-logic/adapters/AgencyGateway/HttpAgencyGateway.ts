import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { DepartmentCode } from "shared/src/address/address.dto";
import { AdminToken } from "shared/src/admin/admin.dto";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  AgencyStatus,
  CreateAgencyDto,
  ListAgenciesByDepartmentCodeRequestDto,
  UpdateAgencyRequestDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import {
  agenciesIdAndNameSchema,
  agenciesSchema,
  agencyIdResponseSchema,
  agencyPublicDisplaySchema,
} from "shared/src/agency/agency.schema";
import {
  agenciesRoute,
  agencyImmersionFacileIdRoute,
  agencyPublicInfoByIdRoute,
} from "shared/src/routes";
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

  public listAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesByDepartmentCodeRequestDto = {
      departmentCode,
    };
    return this.getAgencies(request);
  }

  public listAgencies$(
    departmentCode: DepartmentCode,
  ): Observable<AgencyIdAndName[]> {
    const request: ListAgenciesByDepartmentCodeRequestDto = {
      departmentCode,
    };

    return from(this.getAgencies(request));
  }

  public listPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesByDepartmentCodeRequestDto = {
      departmentCode,
      filter: "peOnly",
    };
    return this.getAgencies(request);
  }

  public listNonPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesByDepartmentCodeRequestDto = {
      departmentCode,
      filter: "peExcluded",
    };
    return this.getAgencies(request);
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

  private async getAgencies(
    request: ListAgenciesByDepartmentCodeRequestDto,
  ): Promise<AgencyIdAndName[]> {
    const response = await this.httpClient.get<unknown>(`/${agenciesRoute}`, {
      params: request,
    });
    const agencies = agenciesIdAndNameSchema.parse(response.data);
    return agencies;
  }
}
