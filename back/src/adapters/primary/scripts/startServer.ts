import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { createApp } from "../server";

const logger = createLogger(__filename);

const getPort = (): number => {
  if (!process.env.PORT) return 1234;
  return parseInt(process.env.PORT);
};

const appConfig = AppConfig.createFromEnv();

createApp(appConfig).then(
  ({ app }) => {
    const port = getPort();
    app.listen(port, "0.0.0.0", () => {
      logger.info(`server started at http://localhost:${port}`);
    });
  },
  (error: any) => {
    logger.error(error, `Server start failed`);
    process.exit(1);
  },
);
