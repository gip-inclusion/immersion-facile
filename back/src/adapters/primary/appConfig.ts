import * as dotenv from "dotenv";
import { AgencyCode, agencyCodeFromString } from "../../shared/agencies";
import {
  makeThrowIfNotDefined,
  ProcessEnv,
  throwIfNotInArray,
} from "../../shared/envHelpers";
import { getFeatureFlags } from "../../shared/featureFlags";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type AccessTokenConfig = {
  clientId: string;
  clientSecret: string;
};

export type AirtableTableConfig = {
  apiKey: string;
  baseId: string;
  tableName: string;
};

export type AxiosConfig = {
  endpoint: string;
  bearerToken: string;
};

// See "Working with AppConfig" in back/README.md for more details.
export class AppConfig {
  private readonly throwIfNotDefined;
  public readonly featureFlags;

  public static createFromEnv(
    readDotEnv = true,
    configParams = process.env,
  ): AppConfig {
    if (readDotEnv) dotenv.config({ path: `${__dirname}/../../../.env` });
    return new AppConfig(configParams);
  }

  private constructor(private readonly env: ProcessEnv) {
    this.throwIfNotDefined = makeThrowIfNotDefined(env);
    this.featureFlags = getFeatureFlags(env);
  }

  public get nodeEnv() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "NODE_ENV",
      authorizedValues: ["test", "production"],
      defaultValue: "production",
    });
  }

  // == Data repositories ==

  public get repositories() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "REPOSITORIES",
      authorizedValues: ["IN_MEMORY", "AIRTABLE", "PG"],
      defaultValue: "IN_MEMORY",
    });
  }

  public useAirtable(): boolean {
    return this.repositories === "AIRTABLE";
  }

  private get airtableApiKey() {
    return this.throwIfNotDefined("AIRTABLE_API_KEY");
  }

  public get airtableGenericImmersionApplicationTableConfig(): AirtableTableConfig {
    return {
      apiKey: this.airtableApiKey,
      baseId: this.throwIfNotDefined("AIRTABLE_BASE_ID_GENERIC"),
      tableName: this.throwIfNotDefined("AIRTABLE_TABLE_NAME_GENERIC"),
    };
  }

  public get airtableBoulogneSurMerImmersionApplicationTableConfig(): AirtableTableConfig {
    return {
      apiKey: this.airtableApiKey,
      baseId: this.throwIfNotDefined("AIRTABLE_BASE_ID_BOULOGNE_SUR_MER"),
      tableName: this.throwIfNotDefined("AIRTABLE_TABLE_NAME_BOULOGNE_SUR_MER"),
    };
  }

  public get airtableNarbonneImmersionApplicationTableConfig(): AirtableTableConfig {
    return {
      apiKey: this.airtableApiKey,
      baseId: this.throwIfNotDefined("AIRTABLE_BASE_ID_NARBONNE"),
      tableName: this.throwIfNotDefined("AIRTABLE_TABLE_NAME_NARBONNE"),
    };
  }

  public get airtableApplicationTableConfig(): AirtableTableConfig {
    return {
      apiKey: this.airtableApiKey,
      baseId: this.throwIfNotDefined("AIRTABLE_BASE_ID_IMMERSION_OFFER"),
      tableName: this.throwIfNotDefined("AIRTABLE_TABLE_NAME_IMMERSION_OFFER"),
    };
  }

  public get pgImmersionDbUrl() {
    const pgHost = this.env.CI ? "postgres" : "localhost";
    // TODO: Should some of these come from environment variables?
    const pgPort = 5432;
    const pgUser = "postgres";
    const pgPassword = "pg-password";
    return `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/immersion-db`;
  }

  // == Sirene repository ==

  public get sireneRepository() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "SIRENE_REPOSITORY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get sireneHttpsConfig(): AxiosConfig {
    return {
      endpoint: this.throwIfNotDefined("SIRENE_ENDPOINT"),
      bearerToken: this.throwIfNotDefined("SIRENE_BEARER_TOKEN"),
    };
  }

  // == Email gateway ==

  public get emailGateway() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "EMAIL_GATEWAY",
      authorizedValues: ["IN_MEMORY", "SENDINBLUE"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get sendinblueApiKey() {
    return this.throwIfNotDefined("SENDINBLUE_API_KEY");
  }

  // == Rome gateway ==

  public get romeGateway() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "ROME_GATEWAY",
      authorizedValues: ["IN_MEMORY", "POLE_EMPLOI"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get poleEmploiClientId() {
    return this.throwIfNotDefined("POLE_EMPLOI_CLIENT_ID");
  }

  public get poleEmploiAccessTokenConfig(): AccessTokenConfig {
    return {
      clientId: this.poleEmploiClientId,
      clientSecret: this.throwIfNotDefined("POLE_EMPLOI_CLIENT_SECRET"),
    };
  }

  // == Magic links ==

  public get immersionFacileBaseUrl() {
    return this.throwIfNotDefined("IMMERSION_FACILE_BASE_URL");
  }

  public get jwtPublicKey() {
    return this.throwIfNotDefined("JWT_PUBLIC_KEY");
  }

  public get jwtPrivateKey() {
    return this.throwIfNotDefined("JWT_PRIVATE_KEY");
  }

  // == Backoffice ==

  public get backofficeUsername() {
    return this.env.BACKOFFICE_USERNAME;
  }
  public get backofficePassword() {
    return this.env.BACKOFFICE_PASSWORD;
  }

  // == Email notifications ==

  public get emailAllowList() {
    return new Set(parseStringList(this.env.EMAIL_ALLOW_LIST));
  }

  public get adminEmails() {
    return parseStringList(this.env.SUPERVISOR_EMAIL);
  }

  public get counsellorEmails() {
    return parseEmailsByAgencyCode(this.env.COUNSELLOR_EMAILS);
  }

  public get validatorEmails() {
    return parseEmailsByAgencyCode(this.env.VALIDATOR_EMAILS);
  }

  public get unrestrictedEmailSendingAgencies() {
    return new Set(
      parseAgencyList(this.env.UNRESTRICTED_EMAIL_SENDING_AGENCIES),
    );
  }

  // == Event Bus ==
  public get eventCrawlerPeriodMs() {
    return parseInteger(this.env.EVENT_CRAWLER_PERIOD_MS, 0);
  }
}

// Parsers

const parseInteger = (str: string | undefined, defaultValue: number): number =>
  str ? parseInt(str) : defaultValue;

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
