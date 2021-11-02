import { AgencyRepository } from "../../domain/immersionApplication/ports/AgencyRepository";
import {
  AgencyCode,
  agencyCodes,
  AgencyId,
  legacyAgencyIds,
  validAgencyCodes,
} from "../../shared/agencies";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "../primary/appConfig";
import { AgencyConfig } from "./../../domain/immersionApplication/ports/AgencyRepository";

const logger = createLogger(__filename);

export type AgencyConfigs = {
  [id: string]: AgencyConfig;
};
export class InMemoryAgencyRepository implements AgencyRepository {
  private readonly configs: AgencyConfigs = {};

  constructor(configList: AgencyConfig[]) {
    configList.forEach((config) => (this.configs[config.id] = config));
    logger.info(this.configs);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    logger.info({ id, configs: this.configs }, "getById");
    return this.configs[id];
  }

  public async getAll(): Promise<AgencyConfig[]> {
    logger.info({ configs: this.configs }, "getAll");
    return Object.values(this.configs);
  }

  public async insert(config: AgencyConfig): Promise<AgencyId | undefined> {
    logger.info({ config, configs: this.configs }, "insert");
    if (this.configs[config.id]) return undefined;
    this.configs[config.id] = config;
    return config.id;
  }
}

export const createAgencyConfigsFromAppConfig = (
  config: AppConfig,
): AgencyConfig[] =>
  validAgencyCodes.map((agencyCode) => {
    const id = legacyAgencyIds[agencyCode];
    if (!id) {
      throw new Error(`Missing id for legacy agencyCode ${agencyCode}`);
    }
    return {
      id: id,
      name: agencyCodes[agencyCode],
      counsellorEmails: config.counsellorEmails[agencyCode] ?? [],
      validatorEmails: config.validatorEmails[agencyCode] ?? [],
      adminEmails: config.adminEmails,
      questionnaireUrl: questionnaireUrls[agencyCode] ?? "",
      signature: signatures[agencyCode],
    } as AgencyConfig;
  });

const questionnaireUrls: Partial<Record<AgencyCode, string>> = {
  AMIE_BOULONAIS:
    "https://docs.google.com/document/d/1LLNoYByQzU6PXmOTN-MHbrhfOOglvTm1dBuzUzgesow/view",
  MLJ_GRAND_NARBONNE:
    "https://drive.google.com/file/d/1GP4JX21uF5RCBk8kbjWtgZjiBBHPYSFO/view",
};

const signatures: Partial<Record<AgencyCode, string>> = {
  AMIE_BOULONAIS: "L'équipe de l'AMIE du Boulonnais",
  MLJ_GRAND_NARBONNE: "L'équipe de la Mission Locale de Narbonne",
  ML_PARIS_SOLEIL: "L'équipe du Site Soleil de la Mission Locale de Paris",
};
