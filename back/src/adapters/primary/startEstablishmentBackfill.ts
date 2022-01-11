import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { random, sleep } from "../../shared/utils";
import { createLogger } from "../../utils/logger";
import { PipelineStats } from "../../utils/pipelineStats";
import { CachingAccessTokenGateway } from "../secondary/core/CachingAccessTokenGateway";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../secondary/core/QpsRateLimiter";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { HttpLaBonneBoiteAPI } from "../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { PoleEmploiAccessTokenGateway } from "../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "./appConfig";
import { createGetPgPoolFn, createRepositories } from "./config";

const logger = createLogger(__filename);

const STATS_LOGGING_INTERVAL_MS = 30_000;

const MAX_QPS_POLE_EMPLOI_ACCESS_TOKEN_GATEWAY = 1;
const MAX_QPS_LA_BONNE_BOITE_GATEWAY = 1;
const MAX_QPS_SIRENE_API = 5;

const stats: PipelineStats = new PipelineStats("startEstablishmentBackfill");

const main = async () => {
  logger.info(`Executing pipeline: establishment-backfill`);
  stats.startTimer("total_runtime");

  const config = AppConfig.createFromEnv();

  const clock = new RealClock();

  const retryStrategy = new ExponentialBackoffRetryStrategy(
    defaultMaxBackoffPeriodMs,
    defaultRetryDeadlineMs,
    clock,
    sleep,
    random,
  );

  const poleEmploiAccessTokenGateway = new CachingAccessTokenGateway(
    new PoleEmploiAccessTokenGateway(
      config.poleEmploiAccessTokenConfig,
      new QpsRateLimiter(
        MAX_QPS_POLE_EMPLOI_ACCESS_TOKEN_GATEWAY,
        clock,
        sleep,
      ),
      retryStrategy,
    ),
  );

  const laBonneBoiteAPI = new HttpLaBonneBoiteAPI(
    poleEmploiAccessTokenGateway,
    config.poleEmploiClientId,
    new QpsRateLimiter(MAX_QPS_LA_BONNE_BOITE_GATEWAY, clock, sleep),
    retryStrategy,
  );

  const sireneGateway = new HttpsSireneRepository(
    config.sireneHttpsConfig,
    clock,
    new QpsRateLimiter(MAX_QPS_SIRENE_API, clock, sleep),
    retryStrategy,
  );

  const repositories = await createRepositories(
    config,
    createGetPgPoolFn(config),
  );

  const updateEstablishmentsAndImmersionOffersFromLastSearches =
    new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
      new UuidV4Generator(),
      laBonneBoiteAPI,
      sireneGateway,
      repositories.searchesMade,
      repositories.immersionOffer,
    );

  const intermediateStatsLogger = setInterval(
    () =>
      logger.info(
        {
          ...stats.readStats(),
          ...updateEstablishmentsAndImmersionOffersFromLastSearches.stats.readStats(),
        },
        "Intermediate Pipeline Statistics",
      ),
    STATS_LOGGING_INTERVAL_MS,
  );

  let errorCode;
  try {
    await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();
    logger.info("Execution completed successfully.");
    errorCode = 0;
  } catch (e: any) {
    logger.error(e, "Execution failed.");
    errorCode = 1;
  }
  stats.stopTimer("total_runtime");
  clearInterval(intermediateStatsLogger);

  logger.info(
    {
      ...stats.readStats(),
      ...updateEstablishmentsAndImmersionOffersFromLastSearches.stats.readStats(),
    },
    "Final Pipeline Statistics",
  );

  process.exit(errorCode);
};

main();
