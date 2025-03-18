import * as Sentry from "@sentry/node";
import type { AppConfig } from "../config/bootstrap/appConfig";
import { version } from "./version";

export const configureSentry = (appConfig: AppConfig) => {
  Sentry.init({
    dsn: "https://eb7a121cd835308163ca9966e5c82c98@o4508405260615680.ingest.de.sentry.io/4508999044038736",
    integrations: [],
    release: version,
    environment: appConfig.envType,
    tracesSampleRate: 1,
  });

  return Sentry;
};

export type SentryInstance = typeof Sentry;
