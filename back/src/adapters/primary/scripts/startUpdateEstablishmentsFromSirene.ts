import { UpdateEstablishmentsFromSireneAPI } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsFromSireneAPI";
import { random, sleep } from "shared/src/utils";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { RealClock } from "../../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../../secondary/core/QpsRateLimiter";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import { HttpAdresseAPI } from "../../secondary/immersionOffer/HttpAdresseAPI";
import { AppConfig } from "../config/appConfig";
import {
  createGetPgPoolFn,
  createRepositories,
} from "../config/repositoriesConfig";

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
  const sireneRepo = new HttpsSireneGateway(
    config.sireneHttpsConfig,
    clock,
    rateLimiter,
    retryStrategy,
  );

  const addresseAPI = new HttpAdresseAPI(rateLimiter, retryStrategy);

  const repositories = await createRepositories(
    config,
    createGetPgPoolFn(config),
    clock,
  );

  const updateEstablishmentsFromSireneAPI =
    new UpdateEstablishmentsFromSireneAPI(
      sireneRepo,
      repositories.immersionOffer,
      addresseAPI,
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

  process.exit(errorCode);
};

main();
