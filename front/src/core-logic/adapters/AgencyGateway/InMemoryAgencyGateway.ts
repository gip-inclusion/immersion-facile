import { Observable, of } from "rxjs";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { toAgencyPublicDisplayDto } from "shared/src/agency/agency";
import {
  AgencyId,
  AgencyInListDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";
import { values } from "ramda";

const MISSION_LOCAL_AGENCY: CreateAgencyDto = {
  id: "test-agency-1-front",
  name: "Test Agency 1 (front)",
  address: "Paris",
  counsellorEmails: [],
  validatorEmails: [],
  kind: "mission-locale",
  questionnaireUrl: "www.questionnaireMissionLocale.com",
  signature: "Mon agence",
  position: {
    lat: 1.0,
    lon: 2.0,
  },
};
const PE_AGENCY: CreateAgencyDto = {
  id: "PE-test-agency-2-front",
  name: "Test Agency 2 PE (front)",
  address: "Paris",
  counsellorEmails: [],
  validatorEmails: [],
  kind: "pole-emploi",
  questionnaireUrl: "www.PE.com",
  signature: "Mon agence PE",
  position: {
    lat: 1.0,
    lon: 2.0,
  },
};
const TEST_NONPE_AGENCIES: Record<string, CreateAgencyDto> = {
  [MISSION_LOCAL_AGENCY.id]: MISSION_LOCAL_AGENCY,
};
const TEST_PE_AGENCIES: Record<string, CreateAgencyDto> = {
  [PE_AGENCY.id]: PE_AGENCY,
};

export class InMemoryAgencyGateway implements AgencyGateway {
  private _nonPeAgencies: Record<string, CreateAgencyDto> = TEST_NONPE_AGENCIES;
  private _peAgencies: Record<string, CreateAgencyDto> = TEST_PE_AGENCIES;

  async addAgency(agency: CreateAgencyDto) {
    if (agency.kind === "pole-emploi") this._peAgencies[agency.id] = agency;
    else this._nonPeAgencies[agency.id] = agency;
  }

  async listAllAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values({ ...this._nonPeAgencies, ...this._peAgencies });
  }

  async listPeAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._peAgencies);
  }

  async listNonPeAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._nonPeAgencies);
  }

  async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const nonPeAgency: CreateAgencyDto | undefined =
      this._nonPeAgencies[agencyId.id];
    if (nonPeAgency) return toAgencyPublicDisplayDto(nonPeAgency);
    const peAgency: CreateAgencyDto | undefined =
      this._nonPeAgencies[agencyId.id];
    if (peAgency) return toAgencyPublicDisplayDto(peAgency);
    throw new Error(`Missing agency with id ${agencyId.id}.`);
  }

  getImmersionFacileAgencyId(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }
}
