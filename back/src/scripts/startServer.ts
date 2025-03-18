import { configureSentry } from "./configureSentry";

import { AppConfig } from "../config/bootstrap/appConfig";
const appConfig = AppConfig.createFromEnv();

configureSentry(appConfig.envType);

import { createApp } from "../config/bootstrap/server";
import { createLogger } from "../utils/logger";
import {
  startPeriodicNodeProcessReport,
  startSamplingEventLoopLag,
} from "../utils/nodeProcessReport";

const logger = createLogger(__filename);

const getPort = (): number => {
  if (!process.env.PORT) return 1234;
  return Number.parseInt(process.env.PORT);
};

createApp(appConfig).then(
  ({ app, gateways }) => {
    const port = getPort();
    app.listen(port, "0.0.0.0", () => {
      logger.info({ message: `server started at http://localhost:${port}` });
      const intervalMs = appConfig.nodeProcessReportInterval;
      const eventLoopSamples: number[] = [];
      const maxSampleSize = Math.max(
        5,
        Math.min(1000, Math.ceil(intervalMs / 50)),
      );
      startSamplingEventLoopLag(
        eventLoopSamples,
        maxSampleSize,
        Math.floor(intervalMs / maxSampleSize),
        logger,
      );
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
    logger.error({ message: `Server start failed, ${error.message}`, error });
    console.error(error);
    process.exit(1);
  },
);
