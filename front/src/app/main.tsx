import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import {
  init as SentryInit,
  browserTracingIntegration,
  replayIntegration,
} from "@sentry/browser";
import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { MinimalErrorPage } from "src/app/pages/error/MinimalErrorPage";
import { store } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";
import { DefaultMetaContent } from "./components/layout/DefaultMetaContent";
import { RouteProvider } from "./routes/routes";

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

SentryInit({
  dsn: "https://8bbb3df20b0910b08f2f435e46f6390f@o4508405260615680.ingest.de.sentry.io/4508999055507536",
  integrations: [browserTracingIntegration(), replayIntegration()],
  release: import.meta.env.VITE_RELEASE_TAG,
  environment: ENV.envType,
  tracesSampleRate: 0.01,
  tracePropagationTargets: [
    "http://localhost:3000/api",
    "https://staging.immersion-facile.beta.gouv.fr/api",
    "https://immersion-facile.beta.gouv.fr/api",
  ],
  replaysOnErrorSampleRate: 1,
  replaysSessionSampleRate: 0,
});
