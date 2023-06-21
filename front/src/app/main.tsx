import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import * as Sentry from "@sentry/browser";
import { App } from "src/app/App";
import { store } from "src/config/dependencies";
import { ENV } from "src/config/environmentVariables";
import { MetaContent } from "./components/layout/MetaContent";
import { RouteProvider } from "./routes/routes";

Sentry.init({
  dsn: "https://c2909f1d7f384d17bde3e75e250f2828@sentry.gip-inclusion.cloud-ed.fr/2",
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  release: import.meta.env.VITE_RELEASE_TAG,
  environment: ENV.envType,
  tracesSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
});

startReactDsfr({ defaultColorScheme: "light" });

const rootContainer = document.getElementById("root");
if (!rootContainer) throw new Error("Html Element with Id 'root' is missing.");
createRoot(rootContainer).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <MetaContent />
        <App />
      </RouteProvider>
    </Provider>
  </React.StrictMode>,
);
