import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { createLogger } from "../../utils/logger";
import { PipelineStats } from "../../utils/pipelineStats";
import { CachingAccessTokenGateway } from "../secondary/core/CachingAccessTokenGateway";
import { APIAdresseGateway } from "../secondary/immersionOffer/APIAdresseGateway";
import {
  httpCallToLaBonneBoite,
  LaBonneBoiteGateway,
} from "../secondary/immersionOffer/LaBonneBoiteGateway";
import {
  httpCallToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";
import { PoleEmploiAccessTokenGateway } from "../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "./appConfig";
import { createGetPgPoolFn, createRepositories } from "./config";

const logger = createLogger(__filename);

const STATS_LOGGING_INTERVAL_MS = 30_000;

const stats: PipelineStats = new PipelineStats("startEstablishmentBackfill");

const main = async () => {
  logger.info(`Executing pipeline: establishment-backfill`);
  stats.startTimer("pipeline-timer");

  const config = AppConfig.createFromEnv();

  const poleEmploiAccessTokenGateway = new CachingAccessTokenGateway(
    new PoleEmploiAccessTokenGateway(config.poleEmploiAccessTokenConfig),
  );

  const laBonneBoite = new LaBonneBoiteGateway(
    poleEmploiAccessTokenGateway,
    config.poleEmploiClientId,
    httpCallToLaBonneBoite,
  );

  const laPlateFormeDeLInclusion = new LaPlateFormeDeLInclusionGateway(
    httpCallToLaPlateFormeDeLInclusion,
  );

  const addressGateway = new APIAdresseGateway();

  const repositories = await createRepositories(
    config,
    createGetPgPoolFn(config),
  );

  const updateEstablishmentsAndImmersionOffersFromLastSearches =
    new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
      laBonneBoite,
      laPlateFormeDeLInclusion,
      addressGateway.getGPSFromAddressAPIAdresse,
      repositories.sirene,
      repositories.immersionOfferForSearch,
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
  stats.stopTimer("pipeline-timer");
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
