import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax, AjaxResponse } from "rxjs/ajax";
import {
  AgencyId,
  AgencyInListDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  ListAgenciesRequestDto,
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

  public listAllAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const request: ListAgenciesRequestDto = { position };
    return this.getAgencies(request);
  }

  public listPeAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const request: ListAgenciesRequestDto = { position, filter: "peOnly" };
    return this.getAgencies(request);
  }

  public listNonPeAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const request: ListAgenciesRequestDto = {
      position,
      filter: "peExcluded",
    };
    return this.getAgencies(request);
  }

  private getAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyInListDto[]> {
    return axios
      .get<AgencyInListDto>(`/${prefix}/${agenciesRoute}`, {
        params: request as ListAgenciesRequestDto,
      })
      .then((data) => listAgenciesResponseSchema.parse(data))
      .catch((error) => Promise.reject(error));
  }
}
