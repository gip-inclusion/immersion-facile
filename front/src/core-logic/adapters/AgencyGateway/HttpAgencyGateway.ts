import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import {
  AgencyDto,
  AgencyId,
  AgencyPublicDisplayDto,
  AgencyStatus,
  AgencyIdAndName,
  CountyCode,
  CreateAgencyDto,
  ListAgenciesWithPositionRequestDto,
  UpdateAgencyRequestDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import {
  agenciesSchema,
  agenciesWithPositionSchema,
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

  getImmersionFacileAgencyId(): Observable<AgencyId | false> {
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

  public listAllAgenciesWithPosition(
    countyCode: CountyCode,
  ): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesWithPositionRequestDto = { countyCode };
    return this.getAgencies(request);
  }

  public listPeAgencies(countyCode: CountyCode): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesWithPositionRequestDto = {
      countyCode,
      filter: "peOnly",
    };
    return this.getAgencies(request);
  }

  public listNonPeAgencies(countyCode: CountyCode): Promise<AgencyIdAndName[]> {
    const request: ListAgenciesWithPositionRequestDto = {
      countyCode,
      filter: "peExcluded",
    };
    return this.getAgencies(request);
  }

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
    request: ListAgenciesWithPositionRequestDto,
  ): Promise<AgencyIdAndName[]> {
    const { data } = await this.httpClient.get<unknown>(`/${agenciesRoute}`, {
      params: request,
    });
    const agenciesWithPositionDto = agenciesWithPositionSchema.parse(data);
    return agenciesWithPositionDto;
  }
}
