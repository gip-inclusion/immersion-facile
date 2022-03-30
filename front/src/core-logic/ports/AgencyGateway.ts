import { AgencyInListDto, CreateAgencyConfig } from "src/shared/agencies";
import { LatLonDto } from "src/shared/latLon";

export interface AgencyGateway {
  addAgency: (params: CreateAgencyConfig) => Promise<void>;
  listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
}
