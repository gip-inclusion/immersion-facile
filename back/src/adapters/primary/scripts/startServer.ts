// <<< --- Tracing SDK should be the first thing to run - KEEP IT FIRST in import list !
import { tracingSdk, tracerExporterUrl } from "./tracing";
// Tracing SDK should be the first thing to run --->>>
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { createApp } from "../server";

const logger = createLogger(__filename);

const port = 1234;

const appConfig = AppConfig.createFromEnv();

tracingSdk
  .start()
  .then(() => {
    logger.info("Tracing SDK started with exporter URL:", tracerExporterUrl);
    return createApp(appConfig);
  })
  .then(
    ({ app }) => {
      app.listen(port, () => {
        logger.info(`server started at http://localhost:${port}`);
      });
    },
    (error: any) => {
      logger.error(error, `Server start failed`);
      process.exit(1);
    },
  );
