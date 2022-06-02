import { Observable } from "rxjs";
import {
  AgencyId,
  AgencyInListDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyGateway {
  addAgency: (params: CreateAgencyDto) => Promise<void>;

  listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;

  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getImmersionFacileAgencyId(): Observable<AgencyId | false>;
}
