import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSirenApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSirenApiScript";
import { createLogger } from "../../../utils/logger";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { InseeSiretGateway } from "../../secondary/siret/InseeSiretGateway";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const main = async () => {
  logger.info(`Executing pipeline: update-establishments-from-sirene`);

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

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const updateEstablishmentsFromSirenAPI =
    new UpdateEstablishmentsFromSirenApiScript(
      uowPerformer,
      siretGateway,
      new RealTimeGateway(),
      config.updateEstablishmentFromInseeConfig.numberOfDaysAgoToCheckForInseeUpdates,
      config.updateEstablishmentFromInseeConfig.maxEstablishmentsPerBatch,
      config.updateEstablishmentFromInseeConfig.maxEstablishmentsPerFullRun,
    );

  const report = await updateEstablishmentsFromSirenAPI.execute();
  await pool.end();

  return report;
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "update-establishments-from-insee-api",
  config,
  main,
  ({ numberOfEstablishmentsToUpdate, establishmentWithNewData }) =>
    [
      `Updating ${numberOfEstablishmentsToUpdate} establishments for Insee Api`,
      `Of which ${establishmentWithNewData} had new data`,
    ].join("\n"),
  logger,
);
