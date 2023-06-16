import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSirenApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSirenApiScript";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
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
    );

  stats.stopTimer("total_runtime");
  const report = await updateEstablishmentsFromSirenAPI.execute();
  await pool.end();

  return report;
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "update-establishments-from-insee-api",
  config,
  main,
  ({
    numberOfEstablishmentsToUpdate,
    establishmentWithNewData,
    errors = {},
  }) => {
    const nSiretFailed = Object.keys(errors).length;
    const errorsAsString = Object.keys(errors)
      .map((siret) => `For siret ${siret} : ${errors[siret]} `)
      .join("\n");

    return [
      `Updating ${numberOfEstablishmentsToUpdate} establishments for Insee Api`,
      `A which ${establishmentWithNewData} had new data`,
      ...(nSiretFailed > 0 ? [`Errors were: ${errorsAsString}`] : []),
    ].join("\n");
  },
  logger,
);
