import { createLogger } from "../../utils/logger";
import { AppConfig } from "./appConfig";
import { createApp } from "./server";

const logger = createLogger(__filename);

const port = 1234;

const appConfig = AppConfig.createFromEnv();
logger.info({ featureFlags: appConfig.featureFlags });

createApp(appConfig).listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
