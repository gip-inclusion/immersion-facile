import { AgencyInListDto, CreateAgencyConfig } from "src/shared/agencies";
import { LatLonDto } from "src/shared/SearchImmersionDto";

export interface AgencyGateway {
  addAgency: (params: CreateAgencyConfig) => Promise<void>;
  listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
}
