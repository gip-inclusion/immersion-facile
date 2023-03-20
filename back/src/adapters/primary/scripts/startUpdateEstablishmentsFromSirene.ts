import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSirenApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSirenApiScript";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import {
  createHttpAddressClient,
  HttpAddressGateway,
  addressesExternalTargets,
  AddressesTargets,
} from "../../secondary/addressGateway/HttpAddressGateway";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../../secondary/core/QpsRateLimiter";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { HttpsSirenGateway } from "../../secondary/sirene/HttpsSirenGateway";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const MAX_QPS_SIRENE__AND_ADDRESS_API = 0.49;

const stats: PipelineStats = new PipelineStats(
  "startUpdateEstablishmentsFromSirene",
);

const main = async () => {
  logger.info(`Executing pipeline: update-establishments-from-sirene`);
  stats.startTimer("total_runtime");

  const config = AppConfig.createFromEnv();

  const timeGateway = new RealTimeGateway();

  const retryStrategy = new ExponentialBackoffRetryStrategy(
    defaultMaxBackoffPeriodMs,
    defaultRetryDeadlineMs,
    timeGateway,
    sleep,
    random,
  );
  const rateLimiter = new QpsRateLimiter(
    MAX_QPS_SIRENE__AND_ADDRESS_API,
    timeGateway,
    sleep,
  );
  const sireneGateway = new HttpsSirenGateway(
    config.sirenHttpsConfig,
    timeGateway,
    rateLimiter,
    retryStrategy,
  );

  const addressAPI = new HttpAddressGateway(
    createHttpAddressClient<AddressesTargets>(addressesExternalTargets),
    config.apiKeyOpenCageDataGeocoding,
    config.apiKeyOpenCageDataGeosearch,
  );

  const pool = new Pool({
    connectionString: config.pgImmersionDbUrl,
  });
  const client = await pool.connect();

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(client);

  const updateEstablishmentsFromSireneAPI =
    new UpdateEstablishmentsFromSirenApiScript(
      establishmentAggregateRepository,
      sireneGateway,
      addressAPI,
      new RealTimeGateway(),
    );

  stats.stopTimer("total_runtime");
  const numberOfEstablishmentsToUpdate =
    await updateEstablishmentsFromSireneAPI.execute();
  client.release();
  return { numberOfEstablishmentsToUpdate };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "update-establishments-from-sirene",
  main,
  ({ numberOfEstablishmentsToUpdate }) =>
    `Script finished with success. Updated ${numberOfEstablishmentsToUpdate} establishments`,
  logger,
);
