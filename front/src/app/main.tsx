import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import {
  browserTracingIntegration,
  replayIntegration,
  init as SentryInit,
} from "@sentry/browser";
import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { RouteProvider } from "shared";
import { App } from "src/app/App";
import { MinimalErrorPage } from "src/app/pages/error/MinimalErrorPage";
import { store } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";
import { DefaultMetaContent } from "./components/layout/DefaultMetaContent";

startReactDsfr({ defaultColorScheme: "light" });

const rootContainer = document.getElementById("root");
if (!rootContainer) throw new Error("Html Element with Id 'root' is missing.");
createRoot(rootContainer).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary
        fallbackRender={({ error }) => <MinimalErrorPage error={error} />}
      >
        <HelmetProvider>
          <RouteProvider>
            <DefaultMetaContent />
            <App />
          </RouteProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </Provider>
  </StrictMode>,
);

if (ENV.envType !== "local") {
  SentryInit({
    dsn: "https://5800b3725ecb4a0cb8461afdb7f2374f@o4510900710146048.ingest.de.sentry.io/4511375917908048",
    integrations: [browserTracingIntegration(), replayIntegration()],
    release: import.meta.env.VITE_RELEASE_TAG,
    environment: ENV.envType,
    sampleRate: 0.05,
    tracesSampleRate: 0.01,
    tracePropagationTargets: [
      "http://localhost:3000/api",
      "https://staging.immersion-facile.beta.gouv.fr/api",
      "https://immersion-facile.beta.gouv.fr/api",
    ],
    replaysOnErrorSampleRate: 0.05,
    replaysSessionSampleRate: 0,
  });
}
