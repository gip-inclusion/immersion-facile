import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSirenApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSirenApiScript";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { HttpAddressGateway } from "../../secondary/addressGateway/HttpAddressGateway";
import { addressesExternalTargets } from "../../secondary/addressGateway/HttpAddressGateway.targets";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { InseeSiretGateway } from "../../secondary/siret/InseeSiretGateway";
import { AppConfig } from "../config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../config/createHttpClientForExternalApi";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const stats: PipelineStats = new PipelineStats(
  "startUpdateEstablishmentsFromSirene",
);

const config = AppConfig.createFromEnv();

const main = async () => {
  logger.info(`Executing pipeline: update-establishments-from-sirene`);
  stats.startTimer("total_runtime");

  const timeGateway = new RealTimeGateway();

  const retryStrategy = new ExponentialBackoffRetryStrategy(
    defaultMaxBackoffPeriodMs,
    defaultRetryDeadlineMs,
    timeGateway,
    sleep,
    random,
  );

  const siretGateway = new InseeSiretGateway(
    config.inseeHttpConfig,
    timeGateway,

    retryStrategy,
  );

  const addressAPI = new HttpAddressGateway(
    configureCreateHttpClientForExternalApi()(addressesExternalTargets),
    config.apiKeyOpenCageDataGeocoding,
    config.apiKeyOpenCageDataGeosearch,
  );

  const pool = new Pool({
    connectionString: config.pgImmersionDbUrl,
  });
  const client = await pool.connect();

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(client);

  const updateEstablishmentsFromSirenAPI =
    new UpdateEstablishmentsFromSirenApiScript(
      establishmentAggregateRepository,
      siretGateway,
      addressAPI,
      new RealTimeGateway(),
    );

  stats.stopTimer("total_runtime");
  const numberOfEstablishmentsToUpdate =
    await updateEstablishmentsFromSirenAPI.execute();
  client.release();
  return { numberOfEstablishmentsToUpdate };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "update-establishments-from-sirene",
  config,
  main,
  ({ numberOfEstablishmentsToUpdate }) =>
    `Script finished with success. Updated ${numberOfEstablishmentsToUpdate} establishments`,
  logger,
);
