import { AgencyRepository } from "../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyInListDto, AgencyId } from "../../shared/agency/agency.dto";
import { createLogger } from "../../utils/logger";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { values } from "ramda";
import { distanceBetweenCoordinatesInMeters } from "../../utils/distanceBetweenCoordinatesInMeters";
import { LatLonDto } from "../../shared/latLon";

const logger = createLogger(__filename);

const testAgencies: AgencyConfig[] = [
  {
    id: "test-agency-1-back",
    name: "Test Agency 1 (back)",
    status: "active",
    kind: "pole-emploi",
    counsellorEmails: ["counsellor@agency1.fr"],
    validatorEmails: ["validator@agency1.fr"],
    adminEmails: ["admin@agency1.fr"],
    questionnaireUrl: "http://questionnaire.agency1.fr",
    signature: "Signature of Test Agency 1",
    address: "Agency 1 address",
    position: {
      lat: 1,
      lon: 2,
    },
  },
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    status: "active",
    kind: "mission-locale",
    counsellorEmails: ["counsellor1@agency2.fr", "counsellor2@agency2.fr"],
    validatorEmails: ["validator1@agency2.fr", "validator2@agency2.fr"],
    adminEmails: ["admin1@agency2.fr", "admin2@agency2.fr"],
    questionnaireUrl: "http://questionnaire.agency2.fr",
    signature: "Signature of Test Agency 2",
    address: "Agency 2 address",
    position: {
      lat: 40,
      lon: 50,
    },
  },
  {
    id: "test-agency-3-back",
    name: "Test Agency 3 (back)",
    status: "active",
    kind: "pole-emploi",
    counsellorEmails: [], // no counsellors
    validatorEmails: ["validator@agency3.fr"],
    adminEmails: ["admin@agency3.fr"],
    questionnaireUrl: "http://questionnaire.agency3.fr",
    signature: "Signature of Test Agency 3",
    address: "Agency 3 address",
    position: {
      lat: 88,
      lon: 89.9999,
    },
  },
];

export class InMemoryAgencyRepository implements AgencyRepository {
  private _agencies: { [id: string]: AgencyConfig } = {};

  constructor(agencyList: AgencyConfig[] = testAgencies) {
    agencyList.forEach((agency) => {
      this._agencies[agency.id] = agency;
    });
    logger.info(this._agencies);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    logger.info({ id, configs: this._agencies }, "getById");
    return this._agencies[id];
  }

  public async getNearby(position: LatLonDto): Promise<AgencyConfig[]> {
    logger.info({ position, configs: this._agencies }, "getNearby");
    return Object.values(this._agencies)
      .filter(isAgencyActive)
      .sort(sortByNearestFrom(position))
      .slice(0, 20);
  }

  public async getAllActive(): Promise<AgencyConfig[]> {
    logger.info({ configs: this._agencies }, "getAll");
    return Object.values(this._agencies).filter(isAgencyActive);
  }

  public async insert(config: AgencyConfig): Promise<AgencyId | undefined> {
    logger.info({ config, configs: this._agencies }, "insert");
    if (this._agencies[config.id]) return undefined;
    this._agencies[config.id] = config;
    return config.id;
  }

  // test purpose only

  get agencies(): AgencyConfig[] {
    return values(this._agencies);
  }

  setAgencies(agencyList: AgencyConfig[]) {
    this._agencies = {};
    agencyList.forEach((agency) => {
      this._agencies[agency.id] = agency;
    });
  }
}

const isAgencyActive = (agency: AgencyConfig) => agency.status === "active";

const sortByNearestFrom =
  (position: LatLonDto) => (a: AgencyInListDto, b: AgencyInListDto) =>
    distanceBetweenCoordinatesInMeters(
      a.position.lat,
      a.position.lon,
      position.lat,
      position.lon,
    ) -
    distanceBetweenCoordinatesInMeters(
      b.position.lat,
      b.position.lon,
      position.lat,
      position.lon,
    );
