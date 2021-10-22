import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { ENV } from "src/environmentVariables";
import "./index.css";
import { RouteProvider } from "./routes";

const todoGateway = new InMemoryTodoGateway();

export const formEstablishmentGateway: FormEstablishmentGateway =
  ENV.gateway === "HTTP"
    ? new HttpFormEstablishmentGateway()
    : new InMemoryFormEstablishmentGateway();

export const immersionApplicationGateway: ImmersionApplicationGateway =
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
