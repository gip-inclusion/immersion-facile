import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

import { App } from "src/app/App";
import { store } from "src/config/dependencies";

import { MetaContent } from "./components/layout/MetaContent";
import { RouteProvider } from "./routes/routes";

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
