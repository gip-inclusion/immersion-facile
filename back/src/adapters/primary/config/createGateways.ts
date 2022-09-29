import axios from "axios";
import { Pool } from "pg";
import {
  ManagedAxios,
  onFullfilledDefaultResponseInterceptorMaker,
} from "shared";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { Clock } from "../../../domain/core/ports/Clock";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { DocumentGateway } from "../../../domain/generic/fileManagement/port/DocumentGateway";
import { createLogger } from "../../../utils/logger";
import {
  httpAdresseApiClient,
  HttpApiAdresseAddressGateway,
} from "../../secondary/addressGateway/HttpApiAdresseAddressGateway";
import {
  HttpOpenCageDataAddressGateway,
  OpenCageDataTargetUrls,
  openCageDataTargetUrlsMapperMaker,
} from "../../secondary/addressGateway/HttpOpenCageDataAddressGateway";
import { InMemoryAddressGateway } from "../../secondary/addressGateway/InMemoryAddressGateway";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { MetabaseDashboardGateway } from "../../secondary/dashboardGateway/MetabaseDashboardGateway";
import { NotImplementedDashboardGateway } from "../../secondary/dashboardGateway/NotImplementedDashboardGateway";
import { HybridEmailGateway } from "../../secondary/emailGateway/HybridEmailGateway";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueEmailGateway } from "../../secondary/emailGateway/SendinblueEmailGateway";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/HttpPassEmploiGateway";
import { HttpPoleEmploiGateway } from "../../secondary/immersionOffer/HttpPoleEmploiGateway";
import { InMemoryAccessTokenGateway } from "../../secondary/immersionOffer/InMemoryAccessTokenGateway";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/InMemoryPassEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/InMemoryPoleEmploiGateway";
import { InMemorySireneGateway } from "../../secondary/InMemorySireneGateway";
import { MinioDocumentGateway } from "../../secondary/MinioDocumentGateway";
import { NotImplementedDocumentGateway } from "../../secondary/NotImplementedDocumentGateway";
import {
  HttpPeConnectGateway,
  PeConnectUrlTargets,
} from "../../secondary/PeConnectGateway/HttpPeConnectGateway";
import {
  httpPeConnectGatewayTargetMapperMaker,
  onRejectPeSpecificResponseInterceptorMaker,
  peConnectApiErrorsToDomainErrors,
} from "../../secondary/PeConnectGateway/HttpPeConnectGateway.config";
import { InMemoryPeConnectGateway } from "../../secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { ExcelExportGateway } from "../../secondary/reporting/ExcelExportGateway";
import { InMemoryExportGateway } from "../../secondary/reporting/InMemoryExportGateway";
import { S3DocumentGateway } from "../../secondary/S3DocumentGateway";
import { AppConfig, makeEmailAllowListPredicate } from "./appConfig";

const logger = createLogger(__filename);

const AXIOS_TIMEOUT_FIVE_SECOND = 5000;

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
export const createGateways = async (config: AppConfig, clock: Clock) => {
  logger.info({
    emailGateway: config.emailGateway,
    repositories: config.repositories,
    romeRepository: config.romeRepository,
    sireneGateway: config.sireneGateway,
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
        clock,
      )
    : new InMemoryAccessTokenGateway();

  return {
    addressApi: createAddressGateway(config),
    dashboardGateway: createDashboardGateway(config),
    documentGateway: createDocumentGateway(config),
    email: createEmailGateway(config, clock),
    laBonneBoiteAPI:
      config.laBonneBoiteGateway === "HTTPS"
        ? new HttpLaBonneBoiteAPI(
            config.peApiUrl,
            cachingAccessTokenGateway,
            config.poleEmploiClientId,
            noRateLimit,
            noRetries,
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
          )
        : new InMemoryPoleEmploiGateway(),
    sirene:
      config.sireneGateway === "HTTPS"
        ? new HttpsSireneGateway(
            config.sireneHttpsConfig,
            clock,
            noRateLimit,
            noRetries,
          )
        : new InMemorySireneGateway(),
    exportGateway:
      config.reporting === "EXCEL"
        ? new ExcelExportGateway()
        : new InMemoryExportGateway(),
  };
};

const createEmailGateway = (config: AppConfig, clock: Clock): EmailGateway => {
  if (config.emailGateway === "IN_MEMORY")
    return new InMemoryEmailGateway(clock);

  const sendInBlueEmailGateway = new SendinblueEmailGateway(
    axios,
    makeEmailAllowListPredicate({
      skipEmailAllowList: config.skipEmailAllowlist,
      emailAllowList: config.emailAllowList,
    }),
    config.apiKeySendinblue,
  );

  if (config.emailGateway === "SENDINBLUE") return sendInBlueEmailGateway;

  if (config.emailGateway === "HYBRID")
    return new HybridEmailGateway(
      sendInBlueEmailGateway,
      new InMemoryEmailGateway(clock, 15),
    );

  const _notReached: never = config.emailGateway;
  throw new Error(`Unknown email gateway kind : ${config.emailGateway}`);
};

const createPoleEmploiConnectGateway = (config: AppConfig) =>
  config.peConnectGateway === "HTTPS"
    ? new HttpPeConnectGateway(
        {
          clientId: config.poleEmploiClientId,
          clientSecret: config.poleEmploiClientSecret,
        },
        new ManagedAxios<PeConnectUrlTargets>(
          httpPeConnectGatewayTargetMapperMaker(config),
          peConnectApiErrorsToDomainErrors,
          {
            timeout: AXIOS_TIMEOUT_FIVE_SECOND,
          },
          onFullfilledDefaultResponseInterceptorMaker,
          onRejectPeSpecificResponseInterceptorMaker,
        ),
      )
    : new InMemoryPeConnectGateway(config.immersionFacileBaseUrl);

const createAddressGateway = (config: AppConfig) => {
  if (config.apiAddress === "IN_MEMORY") return new InMemoryAddressGateway();

  return config.apiAddress === "OPEN_CAGE_DATA"
    ? new HttpOpenCageDataAddressGateway(
        new ManagedAxios<OpenCageDataTargetUrls>(
          openCageDataTargetUrlsMapperMaker(config.apiKeyOpenCageData),
          undefined,
          {
            timeout: AXIOS_TIMEOUT_FIVE_SECOND,
          },
        ),
      )
    : new HttpApiAdresseAddressGateway(httpAdresseApiClient);
};

const createDocumentGateway = (config: AppConfig): DocumentGateway => {
  switch (config.documentGateway) {
    case "S3":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new S3DocumentGateway(config.cellarS3Params!);
    case "MINIO":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new MinioDocumentGateway(config.minioParams!);
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
    : new NotImplementedDashboardGateway();
