import axios from "axios";
import { Pool } from "pg";
import {
  exhaustiveCheck,
  immersionFacileContactEmail,
  pipeWithValue,
} from "shared";
import { NotificationGateway } from "../../../domain/convention/ports/NotificationGateway";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { DocumentGateway } from "../../../domain/generic/fileManagement/port/DocumentGateway";
import { InclusionConnectGateway } from "../../../domain/inclusionConnect/port/InclusionConnectGateway";
import { createLogger } from "../../../utils/logger";
import { HttpAddressGateway } from "../../secondary/addressGateway/HttpAddressGateway";
import { addressesExternalTargets } from "../../secondary/addressGateway/HttpAddressGateway.targets";
import { InMemoryAddressGateway } from "../../secondary/addressGateway/InMemoryAddressGateway";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { CustomTimeGateway } from "../../secondary/core/TimeGateway/CustomTimeGateway";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { MetabaseDashboardGateway } from "../../secondary/dashboardGateway/MetabaseDashboardGateway";
import { StubDashboardGateway } from "../../secondary/dashboardGateway/StubDashboardGateway";
import { EmailableEmailValidationGateway } from "../../secondary/emailValidationGateway/EmailableEmailValidationGateway";
import { emailableValidationTargets } from "../../secondary/emailValidationGateway/EmailableEmailValidationGateway.targets";
import { InMemoryEmailValidationGateway } from "../../secondary/emailValidationGateway/InMemoryEmailValidationGateway";
import { InMemoryAccessTokenGateway } from "../../secondary/immersionOffer/InMemoryAccessTokenGateway";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/laBonneBoite/HttpLaBonneBoiteAPI";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/laBonneBoite/InMemoryLaBonneBoiteAPI";
import { createLbbTargets } from "../../secondary/immersionOffer/laBonneBoite/LaBonneBoiteTargets";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/passEmploi/HttpPassEmploiGateway";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/passEmploi/InMemoryPassEmploiGateway";
import { HttpPoleEmploiGateway } from "../../secondary/immersionOffer/poleEmploi/HttpPoleEmploiGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/immersionOffer/poleEmploi/InMemoryPoleEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { HttpInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/HttpInclusionConnectGateway";
import { makeInclusionConnectExternalTargets } from "../../secondary/InclusionConnectGateway/inclusionConnectExternal.targets";
import { InMemoryInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { BrevoNotificationGateway } from "../../secondary/notificationGateway/BrevoNotificationGateway";
import { brevoNotificationGatewayTargets } from "../../secondary/notificationGateway/BrevoNotificationGateway.targets";
import { HybridNotificationGateway } from "../../secondary/notificationGateway/HybridNotificationGateway";
import { InMemoryNotificationGateway } from "../../secondary/notificationGateway/InMemoryNotificationGateway";
import { NotImplementedDocumentGateway } from "../../secondary/NotImplementedDocumentGateway";
import { HttpPeConnectGateway } from "../../secondary/PeConnectGateway/HttpPeConnectGateway";
import { InMemoryPeConnectGateway } from "../../secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { makePeConnectExternalTargets } from "../../secondary/PeConnectGateway/peConnectApi.targets";
import { ExcelExportGateway } from "../../secondary/reporting/ExcelExportGateway";
import { InMemoryExportGateway } from "../../secondary/reporting/InMemoryExportGateway";
import { S3DocumentGateway } from "../../secondary/S3DocumentGateway";
import { DeterministShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { NanoIdShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/NanoIdShortLinkIdGeneratorGateway";
import { AnnuaireDesEntreprisesSiretGateway } from "../../secondary/siret/AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretTargets } from "../../secondary/siret/AnnuaireDesEntreprisesSiretGateway.targets";
import { InMemorySiretGateway } from "../../secondary/siret/InMemorySiretGateway";
import { InseeSiretGateway } from "../../secondary/siret/InseeSiretGateway";
import { AppConfig, makeEmailAllowListPredicate } from "./appConfig";
import { configureCreateHttpClientForExternalApi } from "./createHttpClientForExternalApi";

const logger = createLogger(__filename);

export type GetPgPoolFn = () => Pool;
export const createGetPgPoolFn = (config: AppConfig): GetPgPoolFn => {
  let pgPool: Pool;
  return () => {
    if (config.repositories !== "PG" && config.romeRepository !== "PG")
      throw new Error(
        `Unexpected pg pool creation: REPOSITORIES=${config.repositories},
         ROME_GATEWAY=${config.romeRepository}`,
      );
    if (!pgPool) {
      const { host, pathname } = new URL(config.pgImmersionDbUrl);
      logger.info({ host, pathname }, "creating postgresql connection pool");
      pgPool = new Pool({
        connectionString: config.pgImmersionDbUrl,
        application_name: "Immersion Backend",
        max: 25,
        statement_timeout: 30_000,
        // statement_timeout is important as it avoids never ending queries.
        // We have had problems with eventBus not triggered due to never ending PG queries
      });
    }
    return pgPool;
  };
};

// prettier-ignore
export type Gateways = ReturnType<typeof createGateways> extends Promise<infer T>
  ? T
  : never;

// eslint-disable-next-line @typescript-eslint/require-await
export const createGateways = async (config: AppConfig) => {
  logger.info({
    notificationGateway: config.notificationGateway,
    repositories: config.repositories,
    romeRepository: config.romeRepository,
    siretGateway: config.siretGateway,
    apiAddress: config.apiAddress,
  });

  const cachingAccessTokenGateway = [
    config.laBonneBoiteGateway,
    config.poleEmploiGateway,
  ].includes("HTTPS")
    ? new CachingAccessTokenGateway(
        new PoleEmploiAccessTokenGateway(
          config.poleEmploiAccessTokenConfig,
          noRateLimit,
          noRetries,
        ),
      )
    : new InMemoryAccessTokenGateway();

  const timeGateway =
    config.timeGateway === "CUSTOM"
      ? new CustomTimeGateway()
      : new RealTimeGateway();

  return {
    addressApi: createAddressGateway(config),
    dashboardGateway: createDashboardGateway(config),
    documentGateway: createDocumentGateway(config),
    notification: createNotificationGateway(config, timeGateway),
    emailValidationGateway: createEmailValidationGateway(config),
    exportGateway:
      config.reporting === "EXCEL"
        ? new ExcelExportGateway()
        : new InMemoryExportGateway(),
    inclusionConnectGateway: createInclusionConnectGateway(config),
    laBonneBoiteAPI:
      config.laBonneBoiteGateway === "HTTPS"
        ? new HttpLaBonneBoiteAPI(
            configureCreateHttpClientForExternalApi(
              axios.create({
                timeout: config.externalAxiosTimeout,
              }),
            )(createLbbTargets(config.peApiUrl)),
            cachingAccessTokenGateway,
            config.poleEmploiClientId,
          )
        : new InMemoryLaBonneBoiteAPI(),
    passEmploiGateway:
      config.passEmploiGateway === "HTTPS"
        ? new HttpPassEmploiGateway(config.passEmploiUrl, config.passEmploiKey)
        : new InMemoryPassEmploiGateway(),
    peConnectGateway: createPoleEmploiConnectGateway(config),
    poleEmploiGateway:
      config.poleEmploiGateway === "HTTPS"
        ? new HttpPoleEmploiGateway(
            config.peApiUrl,
            cachingAccessTokenGateway,
            config.poleEmploiClientId,
            noRateLimit,
            noRetries,
            config.peApiVersion,
          )
        : new InMemoryPoleEmploiGateway(),
    timeGateway,
    siret: getSiretGateway(config.siretGateway, config, timeGateway),
    shortLinkGenerator:
      config.shortLinkIdGeneratorGateway === "NANO_ID"
        ? new NanoIdShortLinkIdGeneratorGateway()
        : new DeterministShortLinkIdGeneratorGateway(),
  };
};

const getSiretGateway = (
  provider: AppConfig["siretGateway"],
  config: AppConfig,
  timeGateway: TimeGateway,
) => {
  const gatewayByProvider = {
    HTTPS: () =>
      new InseeSiretGateway(
        config.inseeHttpConfig,
        timeGateway,
        noRateLimit,
        noRetries,
      ),
    INSEE: () =>
      new InseeSiretGateway(
        config.inseeHttpConfig,
        timeGateway,
        noRateLimit,
        noRetries,
      ),
    IN_MEMORY: () => new InMemorySiretGateway(),
    ANNUAIRE_DES_ENTREPRISES: () =>
      new AnnuaireDesEntreprisesSiretGateway(
        configureCreateHttpClientForExternalApi(
          axios.create({
            timeout: config.externalAxiosTimeout,
          }),
        )(annuaireDesEntreprisesSiretTargets),
        new InseeSiretGateway(
          config.inseeHttpConfig,
          timeGateway,
          noRateLimit,
          noRetries,
        ),
      ),
  };
  return gatewayByProvider[provider]();
};

const createNotificationGateway = (
  config: AppConfig,
  timeGateway: TimeGateway,
): NotificationGateway => {
  if (config.notificationGateway === "IN_MEMORY")
    return new InMemoryNotificationGateway(timeGateway);

  const brevoNotificationGateway = new BrevoNotificationGateway(
    configureCreateHttpClientForExternalApi(
      axios.create({
        timeout: config.externalAxiosTimeout,
      }),
    )(brevoNotificationGatewayTargets),
    makeEmailAllowListPredicate({
      skipEmailAllowList: config.skipEmailAllowlist,
      emailAllowList: config.emailAllowList,
    }),
    config.apiKeyBrevo,
    {
      name: "Immersion Facilitée",
      email: immersionFacileContactEmail,
    },
  );

  if (config.notificationGateway === "BREVO") {
    return brevoNotificationGateway;
  }

  if (config.notificationGateway === "HYBRID")
    return new HybridNotificationGateway(
      brevoNotificationGateway,
      new InMemoryNotificationGateway(timeGateway, 15),
    );

  return exhaustiveCheck(config.notificationGateway, {
    variableName: "config.notificationGateway",
    throwIfReached: true,
  });
};

const createPoleEmploiConnectGateway = (config: AppConfig) =>
  config.peConnectGateway === "HTTPS"
    ? new HttpPeConnectGateway(
        pipeWithValue(
          {
            peApiUrl: config.peApiUrl,
            peAuthCandidatUrl: config.peAuthCandidatUrl,
          },
          makePeConnectExternalTargets,
          configureCreateHttpClientForExternalApi(
            axios.create({
              timeout: config.externalAxiosTimeout,
            }),
          ),
        ),
        {
          immersionFacileBaseUrl: config.immersionFacileBaseUrl,
          poleEmploiClientId: config.poleEmploiClientId,
          poleEmploiClientSecret: config.poleEmploiClientSecret,
        },
      )
    : new InMemoryPeConnectGateway();

const createInclusionConnectGateway = (
  config: AppConfig,
): InclusionConnectGateway =>
  config.inclusionConnectGateway === "HTTPS"
    ? new HttpInclusionConnectGateway(
        pipeWithValue(
          config.inclusionConnectConfig.inclusionConnectBaseUri,
          makeInclusionConnectExternalTargets,
          configureCreateHttpClientForExternalApi(
            axios.create({
              timeout: config.externalAxiosTimeout,
            }),
          ),
        ),
        config.inclusionConnectConfig,
      )
    : new InMemoryInclusionConnectGateway();

const createAddressGateway = (config: AppConfig) =>
  ({
    IN_MEMORY: () => new InMemoryAddressGateway(),
    OPEN_CAGE_DATA: () =>
      new HttpAddressGateway(
        configureCreateHttpClientForExternalApi(
          axios.create({
            timeout: config.externalAxiosTimeout,
          }),
        )(addressesExternalTargets),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
      ),
  }[config.apiAddress]());

const createEmailValidationGateway = (config: AppConfig) =>
  ({
    IN_MEMORY: () => new InMemoryEmailValidationGateway(),
    EMAILABLE: () =>
      new EmailableEmailValidationGateway(
        configureCreateHttpClientForExternalApi(
          axios.create({
            timeout: config.externalAxiosTimeout,
          }),
        )(emailableValidationTargets),
        config.emailableApiKey,
      ),
  }[config.emailValidationGateway]());

const createDocumentGateway = (config: AppConfig): DocumentGateway => {
  switch (config.documentGateway) {
    case "S3":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new S3DocumentGateway(config.cellarS3Params!);
    case "NONE":
      return new NotImplementedDocumentGateway();
    default: {
      const exhaustiveCheck: never = config.documentGateway;
      logger.error(
        "Should not have been reached (Document Gateway declaration)",
      );
      return exhaustiveCheck;
    }
  }
};

const createDashboardGateway = (config: AppConfig): DashboardGateway =>
  config.dashboard === "METABASE"
    ? new MetabaseDashboardGateway(
        config.metabase.metabaseUrl,
        config.metabase.metabaseApiKey,
      )
    : new StubDashboardGateway();
