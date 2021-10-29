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
        uuid: agencyIds[agencyCode],
        name: agencyCodes[agencyCode],
        counsellorEmails: config.counsellorEmails[agencyCode] ?? [],
        validatorEmails: config.validatorEmails[agencyCode] ?? [],
        adminEmails: config.adminEmails,
        questionnaireUrl: questionnaireUrls[agencyCode] ?? "",
        signature: signatures[agencyCode],
      },
    }),
    {},
  );

const agencyIds: Partial<Record<AgencyCode, string>> = {
  AMIE_BOULONAIS: "a025666a-22d7-4752-86eb-d07e27a5766a",
  MLJ_GRAND_NARBONNE: "b0d734df-3047-4e42-aaca-9d86b9e1c81d",
  ML_PARIS_SOLEIL: "c0fddfd9-8fdd-4e1e-8b99-ed5d733d3b83",
};

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
