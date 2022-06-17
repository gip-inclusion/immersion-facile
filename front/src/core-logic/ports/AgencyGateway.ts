import { Observable } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyInListDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;

  listAllAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
  listNonPeAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
  listPeAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;
  listAgenciesNeedingReview(): Promise<AgencyDto[]>;
  validateAgency(agencyId: AgencyId): Promise<void>;
  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getImmersionFacileAgencyId(): Observable<AgencyId | false>;
}
