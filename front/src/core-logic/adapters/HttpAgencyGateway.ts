import axios from "axios";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import {
  AgencyId,
  AgencyInListDto,
  CreateAgencyConfig,
} from "src/shared/agency/agency.dto";
import {
  agencyIdSchema,
  listAgenciesResponseSchema,
} from "src/shared/agency/agency.schema";
import { LatLonDto } from "src/shared/latLon";
import { agenciesRoute, agencyImmersionFacileIdRoute } from "src/shared/routes";

const prefix = "api";

export class HttpAgencyGateway implements AgencyGateway {
  async getImmersionFacileAgencyId(): Promise<AgencyId> {
    const httpResponse = await axios.get(
      `/${prefix}/${agencyImmersionFacileIdRoute}`,
    );
    return agencyIdSchema.parse(httpResponse.data);
  }
  public async addAgency(createAgencyParams: CreateAgencyConfig) {
    await axios.post(`/${prefix}/${agenciesRoute}`, createAgencyParams);
  }

  public async listAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${agenciesRoute}`, {
      params: position,
    });
    const response = listAgenciesResponseSchema.parse(httpResponse.data);
    return response;
  }
}
