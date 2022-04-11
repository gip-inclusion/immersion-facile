import { values } from "ramda";
import { Observable, of } from "rxjs";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import { toAgencyPublicDisplayDto } from "src/shared/agency/agency";
import {
  AgencyInListDto,
  CreateAgencyConfig,
  WithAgencyId,
} from "src/shared/agency/agency.dto";
import { AgencyId } from "src/shared/agency/agency.dto";
import { LatLonDto } from "src/shared/latLon";

const TEST_AGENCIES: Record<string, CreateAgencyConfig> = {
  "test-agency-1-front": {
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
  },
};

export class InMemoryAgencyGateway implements AgencyGateway {
  private _agencies: Record<string, CreateAgencyConfig> = TEST_AGENCIES;

  async addAgency(agency: CreateAgencyConfig) {
    this._agencies[agency.id] = agency;
  }

  async listAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._agencies);
  }

  async getAgencyPublicInfoById(agencyId: WithAgencyId) {
    const agency = this._agencies[agencyId.id];
    return toAgencyPublicDisplayDto(agency);
  }

  getImmersionFacileAgencyId(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }
}
