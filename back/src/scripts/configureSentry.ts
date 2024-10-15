import * as Sentry from "@sentry/node";
import { AppConfig } from "../config/bootstrap/appConfig";
import { version } from "./version";

export const configureSentry = (appConfig: AppConfig) => {
  Sentry.init({
    dsn: "https://5e4e6bbc93a34f3fa4a05aed8373dfe7@sentry.gip-inclusion.cloud-ed.fr/6",
    integrations: [],
    release: version,
    environment: appConfig.envType,
    tracesSampleRate: 1,
  });

  return Sentry;
};

export type SentryInstance = typeof Sentry;
