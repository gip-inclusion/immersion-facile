import { values } from "ramda";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { AgencyInListDto, CreateAgencyConfig } from "src/shared/agencies";
import { LatLonDto } from "src/shared/SearchImmersionDto";

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
}
