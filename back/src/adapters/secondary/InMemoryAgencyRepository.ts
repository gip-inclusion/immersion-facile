import {
  AgencyConfig,
  AgencyRepository,
} from "../../domain/immersionApplication/ports/AgencyRepository";
import {
  AgencyCode,
  agencyCodeFromString,
  validAgencyCodes,
} from "../../shared/agencies";
import { ProcessEnv } from "../../shared/envHelpers";
import { createLogger } from "../../utils/logger";

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

export const createAgencyConfigsFromEnv = (env: ProcessEnv): AgencyConfigs => {
  const adminEmails = parseStringList(env.SUPERVISOR_EMAIL);
  const counsellorEmails = parseEmailsByAgencyCode(
    process.env.COUNSELLOR_EMAILS,
  );
  const unrestrictedEmailSendingAgencies = new Set(
    parseAgencyList(process.env.UNRESTRICTED_EMAIL_SENDING_AGENCIES),
  );

  return validAgencyCodes.reduce(
    (acc, agencyCode) => ({
      ...acc,
      [agencyCode]: {
        adminEmails: adminEmails,
        counsellorEmails: counsellorEmails[agencyCode] ?? [],
        allowUnrestrictedEmailSending:
          unrestrictedEmailSendingAgencies.has(agencyCode),
        questionnaireUrl: questionnaireUrls[agencyCode] ?? "",
        signature: signatures[agencyCode] ?? "",
      },
    }),
    {},
  );
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
};

// Format: <string>,<string>,...
const parseStringList = (str: string | undefined, separator = ","): string[] =>
  (str || "").split(separator).filter((el) => !!el);

// Format: <agencyCode>,<agencyCode>,...
const parseAgencyList = (str: string | undefined): AgencyCode[] =>
  parseStringList(str)
    .map(agencyCodeFromString)
    .filter((agencyCode) => agencyCode !== "_UNKNOWN");

type EmailsByAgencyCode = Partial<Record<AgencyCode, string[]>>;

// Format: <agencyCode>:<email>,<agencyCode>:<email>,...
const parseEmailsByAgencyCode = (
  str: string | undefined,
): EmailsByAgencyCode => {
  return parseStringList(str).reduce<EmailsByAgencyCode>((acc, el) => {
    const [str, email] = el.split(":", 2);
    const agencyCode = agencyCodeFromString(str);
    if (agencyCode === "_UNKNOWN" || !email) return acc;
    return {
      ...acc,
      [agencyCode]: [...(acc[agencyCode] || []), email],
    };
  }, {});
};
