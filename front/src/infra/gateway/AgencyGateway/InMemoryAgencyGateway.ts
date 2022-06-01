import { values } from "ramda";
import { Observable, of } from "rxjs";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import { toAgencyPublicDisplayDto } from "shared/src/agency/agency";
import {
  AgencyId,
  AgencyInListDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

const TEST_AGENCIES: Record<string, CreateAgencyDto> = {
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
  private _agencies: Record<string, CreateAgencyDto> = TEST_AGENCIES;

  async addAgency(agency: CreateAgencyDto) {
    this._agencies[agency.id] = agency;
  }

  async listAgencies(_position: LatLonDto): Promise<AgencyInListDto[]> {
    return values(this._agencies);
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
