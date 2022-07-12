import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { AdminToken } from "shared/src/admin/admin.dto";
import {
  AgencyDto,
  AgencyId,
  AgencyPublicDisplayDto,
  AgencyStatus,
  AgencyWithPositionDto,
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
import { LatLonDto } from "shared/src/latLon";
import {
  agenciesRoute,
  agencyImmersionFacileIdRoute,
  agencyPublicInfoByIdRoute,
} from "shared/src/routes";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const prefix = "api";

export class HttpAgencyGateway implements AgencyGateway {
  getImmersionFacileAgencyId(): Observable<AgencyId | false> {
    return ajax.get<unknown>(`/${prefix}/${agencyImmersionFacileIdRoute}`).pipe(
      map(({ response }) => {
        const agencyIdResponse = validateDataFromSchema(
          agencyIdResponseSchema,
          response,
        );
        if (agencyIdResponse instanceof Error) throw agencyIdResponse;
        return typeof agencyIdResponse === "string" ? agencyIdResponse : false;
      }),
    );
  }

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await axios.post<unknown>(
      `/${prefix}/${agenciesRoute}`,
      createAgencyParams,
    );
  }

  public async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/${agencyPublicInfoByIdRoute}`,
      {
        params: agencyId,
      },
    );
    const agencyPublicDisplayDto = validateDataFromSchema(
      agencyPublicDisplaySchema,
      data,
    );
    if (agencyPublicDisplayDto instanceof Error) throw agencyPublicDisplayDto;
    return agencyPublicDisplayDto;
  }

  public listAllAgenciesWithPosition(
    position: LatLonDto,
  ): Promise<AgencyWithPositionDto[]> {
    const request: ListAgenciesWithPositionRequestDto = { ...position };
    return this.getAgencies(request);
  }

  public listPeAgencies(position: LatLonDto): Promise<AgencyWithPositionDto[]> {
    const request: ListAgenciesWithPositionRequestDto = {
      ...position,
      filter: "peOnly",
    };
    return this.getAgencies(request);
  }

  public listNonPeAgencies(
    position: LatLonDto,
  ): Promise<AgencyWithPositionDto[]> {
    const request: ListAgenciesWithPositionRequestDto = {
      ...position,
      filter: "peExcluded",
    };
    return this.getAgencies(request);
  }

  public async listAgenciesNeedingReview(
    adminToken: AdminToken,
  ): Promise<AgencyDto[]> {
    const needsReviewStatus: AgencyStatus = "needsReview";
    const { data } = await axios.get<unknown>(
      `/${prefix}/admin/${agenciesRoute}`,
      {
        params: { status: needsReviewStatus },
        headers: { authorization: adminToken },
      },
    );
    const agenciesDto = validateDataFromSchema(agenciesSchema, data);
    if (agenciesDto instanceof Error) throw agenciesDto;
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
    await axios.patch<unknown>(
      `/${prefix}/admin/${agenciesRoute}/${agencyId}`,
      validateAgencyParams,
      { headers: { authorization: adminToken } },
    );
  }

  private async getAgencies(
    request: ListAgenciesWithPositionRequestDto,
  ): Promise<AgencyWithPositionDto[]> {
    const { data } = await axios.get<unknown>(`/${prefix}/${agenciesRoute}`, {
      params: request,
    });
    const agenciesWithPositionDto = validateDataFromSchema(
      agenciesWithPositionSchema,
      data,
    );
    if (agenciesWithPositionDto instanceof Error) throw agenciesWithPositionDto;
    return agenciesWithPositionDto;
  }
}
