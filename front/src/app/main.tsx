import "src/assets/css/index.css";
import "src/assets/dsfr/dsfr.min.css";
import "src/assets/dsfr/utility/icons/icons.min.css";
import React from "react";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
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
