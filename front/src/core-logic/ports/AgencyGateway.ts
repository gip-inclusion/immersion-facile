import { Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { CountyCode } from "shared/src/address/address.dto";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;

  listAllAgenciesWithPosition(
    countyCode: CountyCode,
  ): Promise<AgencyIdAndName[]>;
  listNonPeAgencies(countyCode: CountyCode): Promise<AgencyIdAndName[]>;
  listPeAgencies(countyCode: CountyCode): Promise<AgencyIdAndName[]>;
  listAgenciesNeedingReview(adminToken: AdminToken): Promise<AgencyDto[]>;
  validateAgency(adminToken: AdminToken, agencyId: AgencyId): Promise<void>;
  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  getImmersionFacileAgencyId(): Observable<AgencyId | false>;
}
