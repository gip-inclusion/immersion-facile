import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { HttpDemandeImmersionGateway } from "src/core-logic/adapters/HttpDemandeImmersionGateway";
import { HttpImmersionOfferGateway } from "src/core-logic/adapters/HttpImmersionOfferGateway";
import { InMemoryDemandeImmersionGateway } from "src/core-logic/adapters/InMemoryDemandeImmersionGateway";
import { InMemoryImmersionOfferGateway } from "src/core-logic/adapters/InMemoryImmersionOfferGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { DemandeImmersionGateway } from "src/core-logic/ports/DemandeImmersionGateway";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { ENV } from "src/environmentVariables";
import "./index.css";
import { RouteProvider } from "./routes";

const todoGateway = new InMemoryTodoGateway();

export const immersionOfferGateway: ImmersionOfferGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionOfferGateway()
    : new InMemoryImmersionOfferGateway();

export const demandeImmersionGateway: DemandeImmersionGateway =
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
