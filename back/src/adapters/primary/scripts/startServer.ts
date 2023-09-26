import * as Sentry from "@sentry/node";
import { createLogger } from "../../../utils/logger";
import {
  startPeriodicNodeProcessReport,
  startSamplingEventLoopLag,
} from "../../../utils/nodeProcessReport";
import { AppConfig } from "../config/appConfig";
import { createApp } from "../server";
import { version } from "./version";

const logger = createLogger(__filename);

const getPort = (): number => {
  if (!process.env.PORT) return 1234;
  return parseInt(process.env.PORT);
};

const appConfig = AppConfig.createFromEnv();

const configureSentry = (appConfig: AppConfig) => {
  Sentry.init({
    dsn: "https://5e4e6bbc93a34f3fa4a05aed8373dfe7@sentry.gip-inclusion.cloud-ed.fr/6",
    integrations: [],
    release: version,
    environment: appConfig.envType,
    tracesSampleRate: 1,
  });
};

createApp(appConfig).then(
  ({ app, gateways }) => {
    const port = getPort();
    app.listen(port, "0.0.0.0", () => {
      logger.info(`server started at http://localhost:${port}`);
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

    configureSentry(appConfig);
  },
  (error: any) => {
    logger.error(error, `Server start failed`);
    process.exit(1);
  },
);
