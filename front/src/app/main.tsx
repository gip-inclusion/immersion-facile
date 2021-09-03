import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { InMemoryDemandeImmersionGateway } from "src/core-logic/adapters/InMemoryDemandeImmersionGateway";
import { HttpDemandeImmersionGateway } from "src/core-logic/adapters/HttpDemandeImmersionGateway";
import { RouteProvider } from "./routes";

const gateway = import.meta.env.VITE_GATEWAY;

console.log("GATEWAY : ", gateway);

const todoGateway = new InMemoryTodoGateway();

// TODO: don't export the gateway, maybe?
export const demandeImmersionGateway =
  gateway === "HTTP"
    ? new HttpDemandeImmersionGateway()
    : new InMemoryDemandeImmersionGateway();

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
