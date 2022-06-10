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
const TEST_AGENCIES: Record<string, CreateAgencyDto> = {
  [MISSION_LOCAL_AGENCY.id]: MISSION_LOCAL_AGENCY,
  [PE_AGENCY.id]: PE_AGENCY,
};
const TEST_PE_AGENCIES: Record<string, CreateAgencyDto> = {
  [PE_AGENCY.id]: PE_AGENCY,
};

export class InMemoryAgencyGateway implements AgencyGateway {
  /*
  async addAgency(agency: CreateAgencyDto): Promise<void> {
    const index = this._agencies.findIndex(
      (agencyInRepo) => agency.id === agencyInRepo.id,
    );
    index === -1
      ? this._agencies.push(agency)
      : (this._agencies[index] = agency);
    if (agency.kind === "pole-emploi") {
      const index = this._PeAgencies.findIndex(
        (agencyInRepo) => agency.id === agencyInRepo.id,
      );
      index === -1
        ? this._PeAgencies.push(agency)
        : (this._PeAgencies[index] = agency);
    }
  }

  async listAllAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return this._agencies;
  }
  async listPeAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return this._PeAgencies;
  }
  async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies.find((agency) => agency.id === agencyId.id);
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id '${agencyId.id}'.`);
  }
  private _agencies: CreateAgencyDto[] = [MISSION_LOCAL_AGENCY, PE_AGENCY];
  private _PeAgencies: CreateAgencyDto[] = [PE_AGENCY];
  */
  private _agencies: Record<string, CreateAgencyDto> = TEST_AGENCIES;
  private _PeAgencies: Record<string, CreateAgencyDto> = TEST_PE_AGENCIES;

  async addAgency(agency: CreateAgencyDto) {
    this._agencies[agency.id] = agency;
  }

  async listAllAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._agencies);
  }
  async listPeAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._PeAgencies);
  }

  async getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies[agencyId.id];
    return toAgencyPublicDisplayDto(agency);
  }

  getImmersionFacileAgencyId(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }
}
