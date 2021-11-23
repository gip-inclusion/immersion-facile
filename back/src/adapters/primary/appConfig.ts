import * as dotenv from "dotenv";
import {
  makeGetBooleanVariable,
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

export type AxiosConfig = {
  endpoint: string;
  bearerToken: string;
};

// See "Working with AppConfig" in back/README.md for more details.
export class AppConfig {
  private readonly throwIfNotDefined;
  private readonly getBooleanVariable;
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
    this.getBooleanVariable = makeGetBooleanVariable(env);
    this.featureFlags = getFeatureFlags(env);
  }

  public get nodeEnv() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "NODE_ENV",
      authorizedValues: ["test", "local", "production"],
    });
  }

  public get envType() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "ENV_TYPE",
      authorizedValues: ["dev", "staging", "beta", "production", "none"],
      defaultValue: "none",
    });
  }

  // == Data repositories ==

  public get repositories() {
    return throwIfNotInArray({
      processEnv: this.env,
      variableName: "REPOSITORIES",
      authorizedValues: ["IN_MEMORY", "PG"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get pgImmersionDbUrl() {
    if (this.nodeEnv === "production") return this.throwIfNotDefined("PG_URL");
    if (this.env.PG_URL) return this.env.PG_URL;
    return `postgresql://immersion:pg-password@localhost:5432/immersion-db`;
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
    const domain = this.throwIfNotDefined("DOMAIN");
    return domain === "localhost" ? domain : `https://${domain}`;
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
    return parseStringList(this.env.EMAIL_ALLOW_LIST);
  }

  public get skipEmailAllowlist() {
    return this.getBooleanVariable("SKIP_EMAIL_ALLOW_LIST");
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
