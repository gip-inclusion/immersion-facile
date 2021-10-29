import {
  AgencyConfig,
  AgencyRepository,
} from "../../domain/immersionApplication/ports/AgencyRepository";
import {
  AgencyCode,
  agencyCodes,
  validAgencyCodes,
} from "../../shared/agencies";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "../primary/appConfig";

const logger = createLogger(__filename);

export type AgencyConfigs = Partial<Record<AgencyCode, AgencyConfig>>;
export class InMemoryAgencyRepository implements AgencyRepository {
  constructor(private readonly configs: AgencyConfigs) {
    logger.debug(configs);
  }

  public async getConfig(
    agencyCode: AgencyCode,
  ): Promise<AgencyConfig | undefined> {
    return this.configs[agencyCode];
  }
}

export const createAgencyConfigsFromAppConfig = (
  config: AppConfig,
): AgencyConfigs =>
  validAgencyCodes.reduce(
    (acc, agencyCode) => ({
      ...acc,
      [agencyCode]: {
        id: agencyCode,
        name: agencyCodes[agencyCode],
        counsellorEmails: config.counsellorEmails[agencyCode] ?? [],
        validatorEmails: config.validatorEmails[agencyCode] ?? [],
        adminEmails: config.adminEmails,
        questionnaireUrl: questionnaireUrls[agencyCode] ?? "",
        signature: signatures[agencyCode] ?? "",
      },
    }),
    {},
  );

const questionnaireUrls: Partial<Record<AgencyCode, string>> = {
  AMIE_BOULONAIS:
    "https://docs.google.com/document/d/1LLNoYByQzU6PXmOTN-MHbrhfOOglvTm1dBuzUzgesow/view",
  MLJ_GRAND_NARBONNE:
    "https://drive.google.com/file/d/1GP4JX21uF5RCBk8kbjWtgZjiBBHPYSFO/view",
};

const signatures: Partial<Record<AgencyCode, string>> = {
  AMIE_BOULONAIS: "L'équipe de l'AMIE du Boulonnais",
  MLJ_GRAND_NARBONNE: "L'équipe de la Mission Locale de Narbonne",
};
