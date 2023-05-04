import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { createAppDependencies } from "../config/createAppDependencies";
import { startCrawler } from "../startCrawler";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
createAppDependencies(config).then(
  (deps) => startCrawler(deps),
  (error: any) => {
    logger.error(error, `Something went wrong in event crawler`);
    process.exit(1);
  },
);
