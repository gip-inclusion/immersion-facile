import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax, AjaxResponse } from "rxjs/ajax";
import {
  AgencyDto,
  AgencyId,
  AgencyWithPositionDto,
  AgencyPublicDisplayDto,
  AgencyStatus,
  CreateAgencyDto,
  ListAgenciesWithPositionRequestDto,
  UpdateAgencyRequestDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { listAgenciesResponseSchema } from "shared/src/agency/agency.schema";
import { LatLonDto } from "shared/src/latLon";
import {
  agenciesRoute,
  agencyImmersionFacileIdRoute,
  agencyPublicInfoByIdRoute,
} from "shared/src/routes";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const prefix = "api";

export class HttpAgencyGateway implements AgencyGateway {
  getImmersionFacileAgencyId(): Observable<AgencyId | false> {
    return ajax
      .get<AgencyId | { success: boolean }>(
        `/${prefix}/${agencyImmersionFacileIdRoute}`,
      )
      .pipe(
        map((response: AjaxResponse<AgencyId | { success: boolean }>) =>
          typeof response.response === "string" ? response.response : false,
        ),
      );
  }

  public async addAgency(createAgencyParams: CreateAgencyDto) {
    await axios.post(`/${prefix}/${agenciesRoute}`, createAgencyParams);
  }

  public async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    return (
      await axios.get(`/${prefix}/${agencyPublicInfoByIdRoute}`, {
        params: agencyId,
      })
    ).data;
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

  public async listAgenciesNeedingReview(): Promise<AgencyDto[]> {
    const needsReviewStatus: AgencyStatus = "needsReview";
    // const httpResponse = await axios.get(
    //   `/${prefix}/admin/${agenciesRoute}?status=${needsReviewStatus}`,
    // );
    const httpResponse = await axios.get(`/${prefix}/admin/${agenciesRoute}`, {
      params: { status: needsReviewStatus },
    });
    return httpResponse.data;
  }

  public async validateAgency(agencyId: AgencyId): Promise<void> {
    const { id, ...validateAgencyParams }: UpdateAgencyRequestDto = {
      id: agencyId,
      status: "active",
    };
    await axios.patch(
      `/${prefix}/admin/${agenciesRoute}/${agencyId}`,
      validateAgencyParams,
    );
  }
  private async getAgencies(
    request: ListAgenciesWithPositionRequestDto,
  ): Promise<AgencyWithPositionDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${agenciesRoute}`, {
      params: request,
    });
    return listAgenciesResponseSchema.parse(httpResponse.data);
  }
}
