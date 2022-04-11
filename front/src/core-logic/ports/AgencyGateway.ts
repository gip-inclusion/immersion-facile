import {
  AgencyId,
  AgencyInListDto,
  CreateAgencyConfig,
} from "src/shared/agency/agency.dto";
import { LatLonDto } from "src/shared/latLon";

export interface AgencyGateway {
  addAgency: (params: CreateAgencyConfig) => Promise<void>;
  listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
  getImmersionFacileAgencyId(): Promise<AgencyId>;
}
