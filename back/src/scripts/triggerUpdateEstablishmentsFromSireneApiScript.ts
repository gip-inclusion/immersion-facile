import { Pool } from "pg";
import { random, sleep } from "shared";
import { AccessTokenResponse, AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { InMemoryCachingGateway } from "../domains/core/caching-gateway/adapters/InMemoryCachingGateway";
import {
  ExponentialBackoffRetryStrategy,
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
} from "../domains/core/retry-strategy/adapters/ExponentialBackoffRetryStrategy";
import { InseeSiretGateway } from "../domains/core/sirene/adapters/InseeSiretGateway";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UpdateEstablishmentsFromSirenApiScript } from "../domains/establishment/use-cases/UpdateEstablishmentsFromSirenApiScript";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const main = async () => {
  logger.info({
    message: "Executing pipeline: update-establishments-from-sirene",
  });

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
    new InMemoryCachingGateway<AccessTokenResponse>(timeGateway, "expires_in"),
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const { uowPerformer } = createUowPerformer(
    config,
    createGetPgPoolFn(config),
  );

  const updateEstablishmentsFromSirenAPI =
    new UpdateEstablishmentsFromSirenApiScript(
      uowPerformer,
      siretGateway,
      new RealTimeGateway(),
      config.updateEstablishmentFromInseeConfig
        .numberOfDaysAgoToCheckForInseeUpdates,
      config.updateEstablishmentFromInseeConfig.maxEstablishmentsPerBatch,
      config.updateEstablishmentFromInseeConfig.maxEstablishmentsPerFullRun,
    );

  const report = await updateEstablishmentsFromSirenAPI.execute();
  await pool.end();

  return report;
};

handleCRONScript(
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
