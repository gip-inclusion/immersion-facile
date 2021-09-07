import { getFeatureFlags } from "../../shared/featureFlags";
import { logger } from "../../utils/logger";
import { AppConfig, createApp } from "./server";

const port = 1234;

const appConfig: AppConfig = {
  featureFlags: getFeatureFlags(process.env),
};

createApp(appConfig).listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
