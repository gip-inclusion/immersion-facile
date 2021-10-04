import { getFeatureFlags } from "../../shared/featureFlags";
import { createLogger } from "../../utils/logger";
import { AppConfig, createApp } from "./server";

const logger = createLogger(__filename);

const port = 1234;

const appConfig: AppConfig = {
  featureFlags: getFeatureFlags(process.env),
};

logger.info(appConfig, "appConfig:");

createApp(appConfig).listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
