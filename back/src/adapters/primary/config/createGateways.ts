import { Pool } from "pg";
import {
  ManagedAxios,
  onFullfilledDefaultResponseInterceptorMaker,
} from "shared/src/serenity-http-client";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { Clock } from "../../../domain/core/ports/Clock";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { createLogger } from "../../../utils/logger";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { HybridEmailGateway } from "../../secondary/emailGateway/HybridEmailGateway";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueEmailGateway } from "../../secondary/emailGateway/SendinblueEmailGateway";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import {
  apiAddressRateLimiter,
  HttpAddressAPI,
  httpAddressApiClient,
} from "../../secondary/immersionOffer/HttpAddressAPI";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/HttpPassEmploiGateway";
import { HttpPoleEmploiGateway } from "../../secondary/immersionOffer/HttpPoleEmploiGateway";
import { InMemoryAccessTokenGateway } from "../../secondary/immersionOffer/InMemoryAccessTokenGateway";
import { InMemoryAddressAPI } from "../../secondary/immersionOffer/InMemoryAddressAPI";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/InMemoryPassEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { InMemoryDocumentGateway } from "../../secondary/InMemoryDocumentGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/InMemoryPoleEmploiGateway";
import { InMemorySireneGateway } from "../../secondary/InMemorySireneGateway";
import { MinioDocumentGateway } from "../../secondary/MinioDocumentGateway";
import {
  HttpPeConnectGateway,
  PeConnectUrlTargets,
} from "../../secondary/PeConnectGateway/HttpPeConnectGateway";
import { InMemoryReportingGateway } from "../../secondary/reporting/InMemoryReportingGateway";
import {
  httpPeConnectGatewayTargetMapperMaker,
  onRejectPeSpecificResponseInterceptorMaker,
  peConnectApiErrorsToDomainErrors,
} from "../../secondary/PeConnectGateway/HttpPeConnectGateway.config";
import { InMemoryPeConnectGateway } from "../../secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { ExcelReportingGateway } from "../../secondary/reporting/ExcelReportingGateway";
import { AppConfig, makeEmailAllowListPredicate } from "./appConfig";
import { ExcelExportGateway } from "../../secondary/reporting/ExcelExportGateway";
import { InMemoryExportGateway } from "../../secondary/reporting/InMemoryExportGateway";

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
    addressApi:
      config.apiAddress === "HTTPS"
        ? new HttpAddressAPI(
            httpAddressApiClient,
            apiAddressRateLimiter(clock),
            noRetries,
          )
        : new InMemoryAddressAPI(),
    documentGateway:
      config.documentGateway === "MINIO"
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          new MinioDocumentGateway(config.minioParams!)
        : new InMemoryDocumentGateway(),
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
    reportingGateway:
      config.reporting === "EXCEL"
        ? new ExcelReportingGateway()
        : new InMemoryReportingGateway(),
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

  const sendInBlueEmailGateway = SendinblueEmailGateway.create(
    config.sendinblueApiKey,
    makeEmailAllowListPredicate({
      skipEmailAllowList: config.skipEmailAllowlist,
      emailAllowList: config.emailAllowList,
    }),
  );

  if (config.emailGateway === "SENDINBLUE") return sendInBlueEmailGateway;

  if (config.emailGateway === "HYBRID")
    return new HybridEmailGateway(
      sendInBlueEmailGateway,
      new InMemoryEmailGateway(clock, 15),
    );

  const _notReached: never = config.emailGateway;
  throw new Error("Unknown email gateway kind");
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
