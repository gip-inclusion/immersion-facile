import { AgencyRepository } from "../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyId } from "../../shared/agencies";
import { createLogger } from "../../utils/logger";
import { AgencyConfig } from "./../../domain/immersionApplication/ports/AgencyRepository";

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
  },
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    counsellorEmails: ["counsellor1@agency2.fr", "counsellor2@agency2.fr"],
    validatorEmails: ["validator1@agency2.fr", "validator2@agency2.fr"],
    adminEmails: ["admin1@agency2.fr", "admin2@agency2.fr"],
    questionnaireUrl: "http://questionnaire.agency2.fr",
    signature: "Signature of Test Agency 2",
  },
  {
    id: "test-agency-3-back",
    name: "Test Agency 3 (back)",
    counsellorEmails: [], // no counsellors
    validatorEmails: ["validator@agency3.fr"],
    adminEmails: ["admin@agency3.fr"],
    questionnaireUrl: "http://questionnaire.agency3.fr",
    signature: "Signature of Test Agency 3",
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
