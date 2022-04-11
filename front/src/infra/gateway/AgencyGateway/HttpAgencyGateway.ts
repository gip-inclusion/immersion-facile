import axios from "axios";
import { map, Observable, tap } from "rxjs";
import { ajax, AjaxResponse } from "rxjs/ajax";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import {
  AgencyId,
  AgencyInListDto,
  CreateAgencyConfig,
  WithAgencyId,
  AgencyPublicDisplayDto,
} from "src/shared/agency/agency.dto";
import { listAgenciesResponseSchema } from "src/shared/agency/agency.schema";
import { LatLonDto } from "src/shared/latLon";
import {
  agenciesRoute,
  agencyImmersionFacileIdRoute,
  agencyPublicInfoByIdRoute,
} from "src/shared/routes";

const prefix = "api";

export class HttpAgencyGateway implements AgencyGateway {
  getImmersionFacileAgencyId(): Observable<AgencyId | false> {
    return ajax
      .get<AgencyId | { success: boolean }>(
        `/${prefix}/${agencyImmersionFacileIdRoute}`,
      )
      .pipe(
        map((response: AjaxResponse<AgencyId | { success: boolean }>) => {
          return typeof response.response === "string"
            ? response.response
            : false;
        }),
      );
  }

  public async addAgency(createAgencyParams: CreateAgencyConfig) {
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

  public async listAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${agenciesRoute}`, {
      params: position,
    });
    const response = listAgenciesResponseSchema.parse(httpResponse.data);
    return response;
  }
}
function of(
  data: any,
): Observable<AgencyId> | PromiseLike<Observable<AgencyId>> {
  throw new Error("Function not implemented.");
}
