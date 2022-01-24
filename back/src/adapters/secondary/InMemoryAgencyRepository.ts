import { AgencyRepository } from "../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyDto, AgencyId } from "../../shared/agencies";
import { LatLonDto } from "../../shared/SearchImmersionDto";
import { createLogger } from "../../utils/logger";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { distanceMetersBetweenCoordinates } from "./immersionOffer/distanceBetweenCoordinates";

const logger = createLogger(__filename);

const testAgencies: AgencyConfig[] = [
  {
    id: "test-agency-1-back",
    name: "Test Agency 1 (back)",
    counsellorEmails: ["counsellor@agency1.fr"],
    validatorEmails: ["validator@agency1.fr"],
    adminEmails: ["admin@agency1.fr"],
    questionnaireUrl: "http://questionnaire.agency1.fr",
    signature: "Signature of Test Agency 1",
    position: {
      lat: 1,
      lon: 2,
    },
  },
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    counsellorEmails: ["counsellor1@agency2.fr", "counsellor2@agency2.fr"],
    validatorEmails: ["validator1@agency2.fr", "validator2@agency2.fr"],
    adminEmails: ["admin1@agency2.fr", "admin2@agency2.fr"],
    questionnaireUrl: "http://questionnaire.agency2.fr",
    signature: "Signature of Test Agency 2",
    position: {
      lat: 40,
      lon: 50,
    },
  },
  {
    id: "test-agency-3-back",
    name: "Test Agency 3 (back)",
    counsellorEmails: [], // no counsellors
    validatorEmails: ["validator@agency3.fr"],
    adminEmails: ["admin@agency3.fr"],
    questionnaireUrl: "http://questionnaire.agency3.fr",
    signature: "Signature of Test Agency 3",
    position: {
      lat: 88,
      lon: 89.9999,
    },
  },
];

export class InMemoryAgencyRepository implements AgencyRepository {
  private readonly agencies: { [id: string]: AgencyConfig } = {};

  constructor(agencyList: AgencyConfig[] = testAgencies) {
    agencyList.forEach((agency) => {
      this.agencies[agency.id] = agency;
    });
    logger.info(this.agencies);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    logger.info({ id, configs: this.agencies }, "getById");
    return this.agencies[id];
  }

  public async getNearby(position: LatLonDto): Promise<AgencyConfig[]> {
    logger.info({ position, configs: this.agencies }, "getNearby");
    return Object.values(this.agencies)
      .sort(function (a: AgencyDto, b: AgencyDto) {
        return (
          distanceMetersBetweenCoordinates(
            a.position.lat,
            a.position.lon,
            position.lat,
            position.lon,
          ) -
          distanceMetersBetweenCoordinates(
            b.position.lat,
            b.position.lon,
            position.lat,
            position.lon,
          )
        );
      })
      .slice(0, 20);
  }

  public async getAll(): Promise<AgencyConfig[]> {
    logger.info({ configs: this.agencies }, "getAll");
    return Object.values(this.agencies);
  }

  public async insert(config: AgencyConfig): Promise<AgencyId | undefined> {
    logger.info({ config, configs: this.agencies }, "insert");
    if (this.agencies[config.id]) return undefined;
    this.agencies[config.id] = config;
    return config.id;
  }
}
