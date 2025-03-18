import * as Sentry from "@sentry/node";

import type { Environment } from "shared";
import { version } from "./version";

export const configureSentry = (envType: Environment) => {
  Sentry.init({
    dsn: "https://eb7a121cd835308163ca9966e5c82c98@o4508405260615680.ingest.de.sentry.io/4508999044038736",
    integrations: [],
    tracesSampleRate: 1.0,
    environment: envType,
    release: version,
  });

  return Sentry;
};

export type SentryInstance = typeof Sentry;
