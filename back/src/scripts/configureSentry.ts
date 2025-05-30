import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import type { Environment } from "shared";
import { version } from "./version";

export const configureSentry = (envType: Environment) => {
  if (envType === "local") {
    return;
  }
  Sentry.init({
    dsn: "https://eb7a121cd835308163ca9966e5c82c98@o4508405260615680.ingest.de.sentry.io/4508999044038736",
    integrations: [nodeProfilingIntegration()],
    environment: envType,
    release: version,
    tracesSampleRate: 0.01,
    profilesSampleRate: 0.01,
  });

  return Sentry;
};
