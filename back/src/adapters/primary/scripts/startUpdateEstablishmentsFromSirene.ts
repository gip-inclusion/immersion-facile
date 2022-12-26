import { Pool } from "pg";
import { random, sleep } from "shared";
import { UpdateEstablishmentsFromSireneApiScript } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSireneApiScript";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import {
  httpAdresseApiClient,
  HttpApiAdresseAddressGateway,
} from "../../secondary/addressGateway/HttpApiAdresseAddressGateway";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../../secondary/core/QpsRateLimiter";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { HttpsSireneGateway } from "../../secondary/sirene/HttpsSireneGateway";
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
  const sireneGateway = new HttpsSireneGateway(
    config.sireneHttpsConfig,
    timeGateway,
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
      new RealTimeGateway(),
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
