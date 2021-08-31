import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { Router } from "src/app/Router";
import { HttpTodoGateway } from "src/core-logic/adapters/HttpTodoGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { InMemoryFormulaireGateway } from "src/core-logic/adapters/InMemoryFormulaireGateway";
import { HttpFormulaireGateway } from "src/core-logic/adapters/HttpFormulaireGateway";
import { RouteProvider } from "./routes";

const gateway = import.meta.env.VITE_GATEWAY;

console.log("GATEWAY : ", gateway);

const todoGateway =
  gateway === "HTTP" ? new HttpTodoGateway() : new InMemoryTodoGateway();

// TODO: don't export the gateway, maybe?
export const formulaireGateway =
  gateway === "HTTP"
    ? new HttpFormulaireGateway()
    : new InMemoryFormulaireGateway();

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
