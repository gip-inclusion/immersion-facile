import { getFeatureFlags } from "../../shared/featureFlags";
import { logger } from "../../utils/logger";
import { AppConfig, createApp } from "./server";
import * as dotenv from "dotenv";

const port = 1234;

dotenv.config();

const appConfig: AppConfig = {
  featureFlags: getFeatureFlags(process.env),
};

logger.info(appConfig, "appConfig:");

createApp(appConfig).listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
