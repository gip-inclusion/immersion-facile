import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { store } from "src/app/config/dependencies";
import "src/assets/index.css";
import "@gouvfr/dsfr/dist/css/dsfr.min.css";
import { RouteProvider } from "./routing/routes";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <App />
      </RouteProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
