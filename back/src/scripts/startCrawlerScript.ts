import { AppConfig } from "../config/bootstrap/appConfig";
import { createAppDependencies } from "../config/bootstrap/createAppDependencies";
import { startCrawler } from "../config/bootstrap/startCrawler";
import { createLogger } from "../utils/logger";
import { configureSentry } from "./configureSentry";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

configureSentry(config.envType);

createAppDependencies(config).then(
  (deps) => startCrawler(deps),
  (error: any) => {
    logger.error({ message: "Something went wrong in event crawler", error });
    process.exit(1);
  },
);
