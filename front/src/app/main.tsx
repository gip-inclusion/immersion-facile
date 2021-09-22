import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { HttpDemandeImmersionGateway } from "src/core-logic/adapters/HttpDemandeImmersionGateway";
import { InMemoryDemandeImmersionGateway } from "src/core-logic/adapters/InMemoryDemandeImmersionGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import "./index.css";
import { ENV } from "src/environmentVariables";
import { RouteProvider } from "./routes";

const todoGateway = new InMemoryTodoGateway();

export const demandeImmersionGateway =
  ENV.gateway === "HTTP"
    ? new HttpDemandeImmersionGateway()
    : new InMemoryDemandeImmersionGateway(ENV.featureFlags);

const store = configureReduxStore({ todoGateway });

ReactDOM.render(
  <React.StrictMode>
    <RouteProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </RouteProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
