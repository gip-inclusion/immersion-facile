import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSireneApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSireneApiScript";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import {
  httpAdresseApiClient,
  HttpApiAdresseAddressGateway,
} from "../../secondary/addressGateway/HttpApiAdresseAddressGateway";
import { RealClock } from "../../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../../secondary/core/QpsRateLimiter";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { AppConfig } from "../config/appConfig";

const logger = createLogger(__filename);
const MAX_QPS_SIRENE__AND_ADDRESS_API = 0.49;

const stats: PipelineStats = new PipelineStats(
  "startUpdateEstablishmentsFromSirene",
);

const main = async () => {
  logger.info(`Executing pipeline: update-establishments-from-sirene`);
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
  const rateLimiter = new QpsRateLimiter(
    MAX_QPS_SIRENE__AND_ADDRESS_API,
    clock,
    sleep,
  );
  const sireneGateway = new HttpsSireneGateway(
    config.sireneHttpsConfig,
    clock,
    rateLimiter,
    retryStrategy,
  );

  const addressAPI = new HttpApiAdresseAddressGateway(httpAdresseApiClient);

  const pool = new Pool({
    connectionString: config.pgImmersionDbUrl,
  });
  const client = await pool.connect();

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(client);

  const updateEstablishmentsFromSireneAPI =
    new UpdateEstablishmentsFromSireneApiScript(
      establishmentAggregateRepository,
      sireneGateway,
      addressAPI,
      new RealClock(),
    );

  let errorCode;
  try {
    await updateEstablishmentsFromSireneAPI.execute();
    logger.info("Execution completed successfully.");
    errorCode = 0;
  } catch (e: any) {
    logger.error(e, "Execution failed.");
    errorCode = 1;
  }
  stats.stopTimer("total_runtime");
  client.release();
  process.exit(errorCode);
};

main().then(
  () => {
    logger.info(`Script finished success`);
    process.exit(0);
  },
  (error: any) => {
    logger.error(error, `Script failed`);
    process.exit(1);
  },
);
