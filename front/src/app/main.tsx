import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { HttpDemandeImmersionGateway } from "src/core-logic/adapters/HttpDemandeImmersionGateway";
import { InMemoryDemandeImmersionGateway } from "src/core-logic/adapters/InMemoryDemandeImmersionGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { FeatureFlags, getFeatureFlagsFromEnvVariables } from "src/shared/featureFlags";
import "./index.css";
import { RouteProvider } from "./routes";

const env = import.meta.env;
const gateway = env.VITE_GATEWAY;

console.log("GATEWAY : ", gateway);

const todoGateway = new InMemoryTodoGateway();

export const featureFlags: FeatureFlags = getFeatureFlagsFromEnvVariables(
  (name) => env["VITE_" + name]
);

export const demandeImmersionGateway =
  gateway === "HTTP"
    ? new HttpDemandeImmersionGateway()
    : new InMemoryDemandeImmersionGateway(featureFlags);

const store = configureReduxStore({ todoGateway });

ReactDOM.render(
  <React.StrictMode>
    <RouteProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </RouteProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
