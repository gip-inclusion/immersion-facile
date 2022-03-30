import axios from "axios";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import {
  AgencyInListDto,
  CreateAgencyConfig,
  listAgenciesResponseSchema,
} from "src/shared/agencies";
import { LatLonDto } from "src/shared/latLon";
import { agenciesRoute } from "src/shared/routes";

const prefix = "api";

export class HttpAgencyGateway implements AgencyGateway {
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
