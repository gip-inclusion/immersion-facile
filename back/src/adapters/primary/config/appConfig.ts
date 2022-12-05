import * as dotenv from "dotenv";
import { trim } from "ramda";
import {
  AbsoluteUrl,
  makeGetBooleanVariable,
  makeThrowIfNotAbsoluteUrl,
  makeThrowIfNotDefined,
  makeThrowIfNotInArray,
  ProcessEnv,
} from "shared";
import { DomainTopic } from "../../../domain/core/eventBus/events";
import { InclusionConnectConfig } from "../../../domain/inclusionConnect/useCases/InitiateInclusionConnect";
import type { MinioParams } from "../../secondary/MinioDocumentGateway";
import { S3Params } from "../../secondary/S3DocumentGateway";

export type AccessTokenConfig = {
  immersionFacileBaseUrl: AbsoluteUrl;
  peApiUrl: AbsoluteUrl;
  peAuthCandidatUrl: AbsoluteUrl;
  peEnterpriseUrl: AbsoluteUrl;
  clientId: string;
  clientSecret: string;
};

export type AxiosConfig = {
  endpoint: string;
  bearerToken: string;
};

// See "Working with AppConfig" in back/README.md for more details.

export class AppConfig {
  private readonly throwIfNotInArray;
  private readonly throwIfNotDefined;
  private readonly throwIfNotAbsoluteUrl;
  private readonly getBooleanVariable;

  public static createFromEnv(
    readDotEnv = true,
    configParams = process.env,
  ): AppConfig {
    if (readDotEnv) dotenv.config({ path: `${__dirname}/../../../../.env` });
    return new AppConfig(configParams);
  }

  private constructor(readonly env: ProcessEnv) {
    this.throwIfNotInArray = makeThrowIfNotInArray(env);
    this.throwIfNotDefined = makeThrowIfNotDefined(env);
    this.throwIfNotAbsoluteUrl = makeThrowIfNotAbsoluteUrl(env);
    this.getBooleanVariable = makeGetBooleanVariable(env);
  }

  public get reporting() {
    return this.throwIfNotInArray({
      variableName: "REPORTING_GATEWAY",
      authorizedValues: ["IN_MEMORY", "EXCEL"],
    });
  }

  public get nodeEnv() {
    return this.throwIfNotInArray({
      variableName: "NODE_ENV",
      authorizedValues: ["test", "local", "production"],
    });
  }

  public get envType() {
    return this.throwIfNotInArray({
      variableName: "ENV_TYPE",
      authorizedValues: ["dev", "staging", "production", "local"],
      defaultValue: "local",
    });
  }

  // == Data repositories ==

  public get repositories() {
    return this.throwIfNotInArray({
      variableName: "REPOSITORIES",
      authorizedValues: ["IN_MEMORY", "PG"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get pgImmersionDbUrl() {
    if (this.nodeEnv === "production") return this.throwIfNotDefined("PG_URL");
    if (this.env.PG_URL) return this.env.PG_URL;
    return `postgresql://immersion:pg_password@localhost:5432/immersion-db`;
  }

  // == Sirene repository ==

  public get sireneGateway() {
    return this.throwIfNotInArray({
      variableName: "SIRENE_REPOSITORY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get laBonneBoiteGateway() {
    return this.throwIfNotInArray({
      variableName: "LA_BONNE_BOITE_GATEWAY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
    });
  }

  public get passEmploiGateway() {
    return this.throwIfNotInArray({
      variableName: "PASS_EMPLOI_GATEWAY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
    });
  }

  public get passEmploiUrl() {
    return this.throwIfNotDefined("PASS_EMPLOI_URL");
  }

  public get passEmploiKey() {
    return this.throwIfNotDefined("PASS_EMPLOI_KEY");
  }

  public get poleEmploiGateway() {
    return this.throwIfNotInArray({
      variableName: "POLE_EMPLOI_GATEWAY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
    });
  }

  public get poleEmploiUrl() {
    return this.throwIfNotDefined("PASS_EMPLOI_URL");
  }

  public get sireneHttpsConfig(): AxiosConfig {
    return {
      endpoint: this.throwIfNotDefined("SIRENE_ENDPOINT"),
      bearerToken: this.throwIfNotDefined("SIRENE_BEARER_TOKEN"),
    };
  }

  // == Email gateway ==
  public get emailGateway() {
    return this.throwIfNotInArray({
      variableName: "EMAIL_GATEWAY",
      authorizedValues: [
        "IN_MEMORY",
        "HYBRID",
        "SENDINBLUE",
        "SENDINBLUE_HTML",
      ],
      defaultValue: "IN_MEMORY",
    });
  }

  // == Email gateway provider api keys ==
  public get apiKeySendinblue() {
    return this.throwIfNotDefined("SENDINBLUE_API_KEY");
  }

  // == PE Connect gateway ==
  public get peConnectGateway() {
    return this.throwIfNotInArray({
      variableName: "PE_CONNECT_GATEWAY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
      defaultValue: "IN_MEMORY",
    });
  }

  // == Inclusion Connect gateway ==
  public get inclusionConnectGateway() {
    return this.throwIfNotInArray({
      variableName: "INCLUSION_CONNECT_GATEWAY",
      authorizedValues: ["IN_MEMORY", "HTTPS"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get inclusionConnectConfig(): InclusionConnectConfig {
    return {
      clientId: this.throwIfNotDefined("INCLUSION_CONNECT_CLIENT_ID"),
      clientSecret: this.throwIfNotDefined("INCLUSION_CONNECT_CLIENT_SECRET"),
      immersionRedirectUri: `${this.immersionFacileBaseUrl}/api/inclusion-connect`,
      inclusionConnectBaseUri: this.throwIfNotAbsoluteUrl(
        "INCLUSION_CONNECT_BASE_URI",
      ),
      scope: "openid profile email",
      from: "immersion-facilité",
    };
  }

  // == Address Api gateway choice between 2 providers ==
  // https://adresse.data.gouv.fr/
  // https://opencagedata.com/
  public get apiAddress() {
    return this.throwIfNotInArray({
      variableName: "ADDRESS_API_GATEWAY",
      authorizedValues: ["IN_MEMORY", "ADRESSE_API", "OPEN_CAGE_DATA"],
    });
  }

  public get apiKeyOpenCageData() {
    return this.throwIfNotDefined("API_KEY_OPEN_CAGE_DATA");
  }

  // == Rome gateway ==

  public get romeRepository() {
    return this.throwIfNotInArray({
      variableName: "ROME_GATEWAY",
      authorizedValues: ["IN_MEMORY", "PG"],
      defaultValue: "IN_MEMORY",
    });
  }

  public get poleEmploiClientId() {
    return this.throwIfNotDefined("POLE_EMPLOI_CLIENT_ID");
  }

  public get poleEmploiClientSecret() {
    return this.throwIfNotDefined("POLE_EMPLOI_CLIENT_SECRET");
  }

  public get peApiUrl(): AbsoluteUrl {
    return this.throwIfNotAbsoluteUrl("POLE_EMPLOI_API_URL");
  }
  public get peAuthCandidatUrl(): AbsoluteUrl {
    return this.throwIfNotAbsoluteUrl(
      "POLE_EMPLOI_AUTHENTIFICATION_CANDIDAT_URL",
    );
  }
  public get peEnterpriseUrl(): AbsoluteUrl {
    return this.throwIfNotAbsoluteUrl("POLE_EMPLOI_ENTREPRISE_URL");
  }

  public get poleEmploiAccessTokenConfig(): AccessTokenConfig {
    return {
      immersionFacileBaseUrl: this.immersionFacileBaseUrl,
      peApiUrl: this.peApiUrl,
      peAuthCandidatUrl: this.peAuthCandidatUrl,
      peEnterpriseUrl: this.peEnterpriseUrl,
      clientId: this.poleEmploiClientId,
      clientSecret: this.throwIfNotDefined("POLE_EMPLOI_CLIENT_SECRET"),
    };
  }

  // == Metabase
  public get dashboard() {
    return this.throwIfNotInArray({
      variableName: "DASHBOARD_GATEWAY",
      authorizedValues: ["METABASE", "NONE"],
      defaultValue: "NONE",
    });
  }

  public get metabase() {
    return {
      metabaseUrl: this.throwIfNotDefined("METABASE_URL") as AbsoluteUrl,
      metabaseApiKey: this.throwIfNotDefined("METABASE_API_KEY"),
    };
  }

  // == Magic links ==

  public get immersionFacileBaseUrl(): AbsoluteUrl {
    const domain = this.throwIfNotDefined("DOMAIN");
    return domain.includes("localhost")
      ? `http://${domain}`
      : `https://${domain}`;
  }

  public get apiJwtPublicKey() {
    return this.throwIfNotDefined("API_JWT_PUBLIC_KEY");
  }

  public get apiJwtPrivateKey() {
    return this.throwIfNotDefined("API_JWT_PRIVATE_KEY");
  }

  public get magicLinkJwtPublicKey() {
    return this.throwIfNotDefined("JWT_PUBLIC_KEY");
  }

  public get magicLinkJwtPrivateKey() {
    return this.throwIfNotDefined("JWT_PRIVATE_KEY");
  }

  public get magicLinkJwtPreviousPublicKey() {
    return this.env.JWT_PREVIOUS_PUBLIC_KEY;
  }

  public get magicLinkJwtPreviousPrivateKey() {
    return this.env.JWT_PREVIOUS_PRIVATE_KEY;
  }

  // == Backoffice ==

  public get backofficeUsername() {
    return this.throwIfNotDefined("BACKOFFICE_USERNAME");
  }
  public get backofficePassword() {
    return this.throwIfNotDefined("BACKOFFICE_PASSWORD");
  }

  public get adminJwtSecret() {
    return this.throwIfNotDefined("ADMIN_JWT_SECRET");
  }

  // == Email notifications ==

  public get emailAllowList() {
    return parseStringList(this.env.EMAIL_ALLOW_LIST);
  }

  public get defaultAdminEmail() {
    return this.throwIfNotDefined("ADMIN_EMAIL");
  }

  public get skipEmailAllowlist() {
    return this.getBooleanVariable("SKIP_EMAIL_ALLOW_LIST");
  }

  // == Discord notifications ==
  public get discordWebhookUrl() {
    return this.env.DISCORD_WEBHOOK_URL;
  }

  // == Event Bus ==
  public get eventCrawlerPeriodMs() {
    return parseInteger(this.env.EVENT_CRAWLER_PERIOD_MS, 0);
  }

  public get quarantinedTopics(): DomainTopic[] {
    return parseStringList(this.env.QUARANTINED_TOPICS).filter(
      (el) => !!el,
    ) as DomainTopic[];
  }

  // == Storage ==
  public get storageRoot() {
    return this.throwIfNotDefined("STORAGE_ROOT");
  }

  // Visible for testing.
  public get configParams() {
    return this.env;
  }

  public get documentGateway() {
    return this.throwIfNotInArray({
      authorizedValues: ["NONE", "MINIO", "S3"],
      variableName: "DOCUMENT_GATEWAY",
      defaultValue: "NONE",
    });
  }

  public get cellarS3Params(): S3Params | undefined {
    if (this.documentGateway === "S3") {
      return {
        endPoint: this.throwIfNotDefined("CELLAR_ADDON_HOST"),
        accessKeyId: this.throwIfNotDefined("CELLAR_ADDON_KEY_ID"),
        secretAccessKey: this.throwIfNotDefined("CELLAR_ADDON_KEY_SECRET"),
        bucketName: this.throwIfNotDefined("CELLAR_BUCKET"),
      };
    }
  }

  public get minioParams(): MinioParams | undefined {
    if (this.documentGateway === "MINIO") {
      return {
        endPoint: this.throwIfNotDefined("MINIO_ENDPOINT"),
        port: +this.throwIfNotDefined("MINO_PORT"),
        accessKey: this.throwIfNotDefined("MINIO_ACCESS_KEY"),
        secretKey: this.throwIfNotDefined("MINIO_SECRET_KEY"),
        bucketName: this.throwIfNotDefined("MINIO_BUCKET"),
      };
    }
  }
}

// Parsers

const parseInteger = (str: string | undefined, defaultValue: number): number =>
  str ? parseInt(str) : defaultValue;

// Format: <string>,<string>,...
const parseStringList = (str: string | undefined, separator = ","): string[] =>
  (str || "")
    .split(separator)
    .map(trim)
    .filter((el) => !!el);

// Email allow list from env variable
export const makeEmailAllowListPredicate = ({
  skipEmailAllowList,
  emailAllowList,
}: {
  skipEmailAllowList: boolean;
  emailAllowList: string[];
}): ((recipient: string) => boolean) =>
  skipEmailAllowList
    ? (_recipient: string) => true
    : (recipient: string): boolean => emailAllowList.includes(recipient);
