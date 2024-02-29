import { AppConfig } from "../adapters/primary/config/appConfig";
import { createAppDependencies } from "../adapters/primary/config/createAppDependencies";
import { startCrawler } from "../adapters/primary/startCrawler";
import { createLogger } from "../utils/logger";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
createAppDependencies(config).then(
  (deps) => startCrawler(deps),
  (error: any) => {
    logger.error(error, "Something went wrong in event crawler");
    process.exit(1);
  },
);
