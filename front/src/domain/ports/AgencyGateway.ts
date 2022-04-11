import { Observable } from "rxjs";
import {
  AgencyId,
  AgencyInListDto,
  CreateAgencyConfig,
  WithAgencyId,
  AgencyPublicDisplayDto,
} from "src/shared/agency/agency.dto";
import { LatLonDto } from "src/shared/latLon";

export interface AgencyGateway {
  addAgency: (params: CreateAgencyConfig) => Promise<void>;

  listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;

  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getImmersionFacileAgencyId(): Observable<AgencyId | false>;
}
