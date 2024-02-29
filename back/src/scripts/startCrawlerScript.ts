import { AppConfig } from "../config/bootstrap/appConfig";
import { createAppDependencies } from "../config/bootstrap/createAppDependencies";
import { startCrawler } from "../config/bootstrap/startCrawler";
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
