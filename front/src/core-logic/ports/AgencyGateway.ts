import { Observable } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyWithPositionDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;

  listAllAgenciesWithPosition(
    position: LatLonDto,
  ): Promise<AgencyWithPositionDto[]>;
  listNonPeAgencies(position: LatLonDto): Promise<AgencyWithPositionDto[]>;
  listPeAgencies(position: LatLonDto): Promise<AgencyWithPositionDto[]>;
  listAgenciesNeedingReview(): Promise<AgencyDto[]>;
  validateAgency(agencyId: AgencyId): Promise<void>;
  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getImmersionFacileAgencyId(): Observable<AgencyId | false>;
}
