import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import type { Environment } from "shared";
import { version } from "./version";

export const configureSentry = (
  envType: Environment,
  options?: { traceRate?: number },
) => {
  if (envType === "local") {
    return;
  }
  Sentry.init({
    dsn: "https://b2ec1b4e1c0b71ef7b919083f5422019@o4510900710146048.ingest.de.sentry.io/4511375925182544",
    integrations: [
      Sentry.httpIntegration(),
      Sentry.nativeNodeFetchIntegration(),
      nodeProfilingIntegration(),
    ],
    environment: envType,
    release: version,
    tracesSampleRate: options?.traceRate ?? 0.01,
    profilesSampleRate: 0.01,
  });

  return Sentry;
};
