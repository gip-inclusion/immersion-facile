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
import { HttpAdresseAPI } from "../secondary/immersionOffer/HttpAdresseAPI";
import { HttpLaBonneBoiteAPI } from "../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { HttpLaPlateformeDeLInclusionAPI } from "../secondary/immersionOffer/HttpLaPlateformeDeLInclusionAPI";
import { PoleEmploiAccessTokenGateway } from "../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "./appConfig";
import { createGetPgPoolFn, createRepositories } from "./config";

const logger = createLogger(__filename);

const STATS_LOGGING_INTERVAL_MS = 30_000;

const MAX_QPS_LA_BONNE_BOITE_GATEWAY = 1;
const MAX_QPS_LA_PLATEFORME_DE_L_INCLUSION = 1;
const MAX_QPS_API_ADRESSE = 5;
const MAX_QPS_SIRENE_API = 5;

const stats: PipelineStats = new PipelineStats("startEstablishmentBackfill");

const main = async () => {
  logger.info(`Executing pipeline: establishment-backfill`);
  stats.startTimer("total_runtime");

  const config = AppConfig.createFromEnv();

  const clock = new RealClock();

  const uuidGenerator = new UuidV4Generator();

  const poleEmploiAccessTokenGateway = new CachingAccessTokenGateway(
    new PoleEmploiAccessTokenGateway(config.poleEmploiAccessTokenConfig),
  );

  const laBonneBoiteAPI = new HttpLaBonneBoiteAPI(
    poleEmploiAccessTokenGateway,
    config.poleEmploiClientId,
    new QpsRateLimiter(MAX_QPS_LA_BONNE_BOITE_GATEWAY, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );

  const adresseAPI = new HttpAdresseAPI(
    new QpsRateLimiter(MAX_QPS_API_ADRESSE, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );

  const laPlateFormeDeLInclusionAPI = new HttpLaPlateformeDeLInclusionAPI(
    adresseAPI,
    new QpsRateLimiter(MAX_QPS_LA_PLATEFORME_DE_L_INCLUSION, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );

  const sireneGateway = new HttpsSireneRepository(
    config.sireneHttpsConfig,
    clock,
    new QpsRateLimiter(MAX_QPS_SIRENE_API, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );

  const repositories = await createRepositories(
    config,
    createGetPgPoolFn(config),
  );

  const updateEstablishmentsAndImmersionOffersFromLastSearches =
    new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
      uuidGenerator,
      laBonneBoiteAPI,
      laPlateFormeDeLInclusionAPI,
      adresseAPI,
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
