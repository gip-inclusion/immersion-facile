import { createLogger } from "../../../utils/logger";
import {
  startPeriodicNodeProcessReport,
  startSamplingEventLoopLag,
} from "../../../utils/nodeProcessReport";
import { AppConfig } from "../config/appConfig";
import { createApp } from "../server";

const logger = createLogger(__filename);

const getPort = (): number => {
  if (!process.env.PORT) return 1234;
  return parseInt(process.env.PORT);
};

const appConfig = AppConfig.createFromEnv();

createApp(appConfig).then(
  ({ app, gateways }) => {
    const port = getPort();
    app.listen(port, "0.0.0.0", () => {
      logger.info(`server started at http://localhost:${port}`);
      const intervalMs = appConfig.nodeProcessReportInterval;
      const eventLoopSamples: number[] = [];
      const maxSampleSize = Math.max(
        5,
        Math.min(500, Math.ceil(intervalMs / 100)),
      );
      startSamplingEventLoopLag(eventLoopSamples, maxSampleSize);
      startPeriodicNodeProcessReport(
        intervalMs,
        gateways.timeGateway,
        logger,
        eventLoopSamples,
        maxSampleSize,
      );
    });
  },
  (error: any) => {
    logger.error(error, `Server start failed`);
    process.exit(1);
  },
);
