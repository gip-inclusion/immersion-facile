import React from "react";
import ReactDOM from "react-dom";
import { App } from "src/app/App";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { ENV } from "src/environmentVariables";
import "./index.css";
import { RouteProvider } from "./routes";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";

export const formEstablishmentGateway: FormEstablishmentGateway =
  ENV.gateway === "HTTP"
    ? new HttpFormEstablishmentGateway()
    : new InMemoryFormEstablishmentGateway();

export const immersionApplicationGateway: ImmersionApplicationGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionApplicationGateway()
    : new InMemoryImmersionApplicationGateway(ENV.featureFlags);

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionSearchGateway()
    : new InMemoryImmersionSearchGateway();

ReactDOM.render(
  <React.StrictMode>
    <RouteProvider>
      <App />
    </RouteProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
