import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionOfferGateway } from "src/core-logic/adapters/HttpImmersionOfferGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionOfferGateway } from "src/core-logic/adapters/InMemoryImmersionOfferGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
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

export const demandeImmersionGateway: ImmersionApplicationGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionApplicationGateway()
    : new InMemoryImmersionApplicationGateway(ENV.featureFlags);

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
