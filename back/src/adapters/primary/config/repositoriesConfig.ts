import { Pool } from "pg";
import { Clock } from "../../../domain/core/ports/Clock";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { RomeRepository } from "../../../domain/rome/ports/RomeRepository";
import { createLogger } from "../../../utils/logger";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { HttpPeConnectGateway } from "../../secondary/HttpPeConnectGateway";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/HttpPassEmploiGateway";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryLaBonneBoiteRequestRepository } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/InMemoryPassEmploiGateway";
import { InMemorySearchMadeRepository } from "../../secondary/immersionOffer/InMemorySearchMadeRepository";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryDocumentGateway } from "../../secondary/InMemoryDocumentGateway";
import { InMemoryEmailGateway } from "../../secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionApplicationQueries } from "../../secondary/InMemoryImmersionApplicationQueries";
import { InMemoryImmersionApplicationRepository } from "../../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryPeConnectGateway } from "../../secondary/InMemoryPeConnectGateway";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemorySireneGateway } from "../../secondary/InMemorySireneGateway";
import { makeStubGetApiConsumerById } from "../../secondary/makeStubGetApiConsumerById";
import { makeStubGetFeatureFlags } from "../../secondary/makeStubGetFeatureFlags";
import { MinioDocumentGateway } from "../../secondary/MinioDocumentGateway";
import { makePgGetApiConsumerById } from "../../secondary/pg/makePgGetApiConsumerById";
import { makePgGetFeatureFlags } from "../../secondary/pg/makePgGetFeatureFlags";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { PgEstablishmentExportQueries } from "../../secondary/pg/PgEstablishmentExportQueries";
import { PgFormEstablishmentRepository } from "../../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionApplicationQueries } from "../../secondary/pg/PgImmersionApplicationQueries";
import { PgImmersionApplicationRepository } from "../../secondary/pg/PgImmersionApplicationRepository";
import { PgLaBonneBoiteRequestRepository } from "../../secondary/pg/PgLaBonneBoiteRequestRepository";
import { PgOutboxQueries } from "../../secondary/pg/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { PgPostalCodeDepartmentRegionQueries } from "../../secondary/pg/PgPostalCodeDepartmentRegionQueries";
import { PgRomeRepository } from "../../secondary/pg/PgRomeRepository";
import { PgSearchMadeRepository } from "../../secondary/pg/PgSearchMadeRepository";
import { ExcelReportingGateway } from "../../secondary/reporting/ExcelReportingGateway";
import { InMemoryReportingGateway } from "../../secondary/reporting/InMemoryReportingGateway";
import { SendinblueEmailGateway } from "../../secondary/SendinblueEmailGateway";
import { StubEstablishmentExportQueries } from "../../secondary/StubEstablishmentExportQueries";
import { StubPostalCodeDepartmentRegionQueries } from "../../secondary/StubPostalCodeDepartmentRegionQueries";
import { AppConfig } from "./appConfig";

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
      pgPool = new Pool({ connectionString: config.pgImmersionDbUrl, max: 20 });
    }
    return pgPool;
  };
};

// prettier-ignore
export type Repositories = ReturnType<typeof createRepositories> extends Promise<infer T>
  ? T
  : never;

export const createRepositories = async (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
  clock: Clock,
) => {
  logger.info({
    repositories: config.repositories,
    sireneGateway: config.sireneGateway,
    emailGateway: config.emailGateway,
    romeRepository: config.romeRepository,
  });

  const outboxRepo =
    config.repositories === "PG"
      ? new PgOutboxRepository(await getPgPoolFn().connect())
      : new InMemoryOutboxRepository();

  const outboxQueries =
    outboxRepo instanceof PgOutboxRepository
      ? new PgOutboxQueries(await getPgPoolFn().connect())
      : new InMemoryOutboxQueries(outboxRepo);

  const immersionApplicationRepo =
    config.repositories === "PG"
      ? new PgImmersionApplicationRepository(await getPgPoolFn().connect())
      : new InMemoryImmersionApplicationRepository();

  const immersionApplicationRepoQueries =
    immersionApplicationRepo instanceof PgImmersionApplicationRepository
      ? new PgImmersionApplicationQueries(await getPgPoolFn().connect())
      : new InMemoryImmersionApplicationQueries(immersionApplicationRepo);

  return {
    immersionApplication: immersionApplicationRepo,
    immersionApplicationQueries: immersionApplicationRepoQueries,

    establishmentExport:
      config.repositories === "PG"
        ? new PgEstablishmentExportQueries(await getPgPoolFn().connect())
        : StubEstablishmentExportQueries,

    formEstablishment:
      config.repositories === "PG"
        ? new PgFormEstablishmentRepository(await getPgPoolFn().connect())
        : new InMemoryFormEstablishmentRepository(),

    searchesMade:
      config.repositories === "PG"
        ? new PgSearchMadeRepository(await getPgPoolFn().connect())
        : new InMemorySearchMadeRepository(),

    immersionOffer:
      config.repositories === "PG"
        ? new PgEstablishmentAggregateRepository(
            // Details in https://node-postgres.com/features/pooling
            // Now using connection pool
            // TODO: Still we would need to release the connection
            await getPgPoolFn().connect(),
          )
        : new InMemoryEstablishmentAggregateRepository(),

    laBonneBoiteRequest:
      config.repositories === "PG"
        ? new PgLaBonneBoiteRequestRepository(await getPgPoolFn().connect())
        : new InMemoryLaBonneBoiteRequestRepository(),

    agency:
      config.repositories === "PG"
        ? new PgAgencyRepository(await getPgPoolFn().connect())
        : new InMemoryAgencyRepository(),

    sirene:
      config.sireneGateway === "HTTPS"
        ? new HttpsSireneGateway(
            config.sireneHttpsConfig,
            clock,
            noRateLimit,
            noRetries,
          )
        : new InMemorySireneGateway(),

    email:
      config.emailGateway === "SENDINBLUE"
        ? SendinblueEmailGateway.create(config.sendinblueApiKey)
        : new InMemoryEmailGateway(),

    rome: await createRomeRepository(config, getPgPoolFn),

    outbox: outboxRepo,
    outboxQueries,

    laBonneBoiteAPI:
      config.laBonneBoiteGateway === "HTTPS"
        ? new HttpLaBonneBoiteAPI(
            new CachingAccessTokenGateway(
              new PoleEmploiAccessTokenGateway(
                config.poleEmploiAccessTokenConfig,
                noRateLimit,
                noRetries,
              ),
              clock,
            ),
            config.poleEmploiClientId,
            noRateLimit,
            noRetries,
          )
        : new InMemoryLaBonneBoiteAPI(),
    passEmploiGateway:
      config.passEmploiGateway === "HTTPS"
        ? new HttpPassEmploiGateway(config.passEmploiUrl, config.passEmploiKey)
        : new InMemoryPassEmploiGateway(),

    peConnectGateway:
      config.peConnectGateway === "HTTPS"
        ? new HttpPeConnectGateway(config.poleEmploiAccessTokenConfig)
        : new InMemoryPeConnectGateway(config.immersionFacileBaseUrl),

    postalCodeDepartmentRegion:
      config.repositories === "PG"
        ? new PgPostalCodeDepartmentRegionQueries(await getPgPoolFn().connect())
        : StubPostalCodeDepartmentRegionQueries,

    getApiConsumerById:
      config.repositories === "PG"
        ? makePgGetApiConsumerById(await getPgPoolFn().connect())
        : makeStubGetApiConsumerById({ clock }),
    getFeatureFlags:
      config.repositories === "PG"
        ? makePgGetFeatureFlags(await getPgPoolFn().connect())
        : makeStubGetFeatureFlags(),
    reportingGateway:
      config.reporting === "EXCEL"
        ? new ExcelReportingGateway()
        : new InMemoryReportingGateway(),
    documentGateway:
      config.documentGateway === "MINIO"
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          new MinioDocumentGateway(config.minioParams!)
        : new InMemoryDocumentGateway(),
  };
};

const createRomeRepository = async (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
): Promise<RomeRepository> => {
  switch (config.romeRepository) {
    case "PG":
      return new PgRomeRepository(await getPgPoolFn().connect());
    default:
      return new InMemoryRomeRepository();
  }
};
