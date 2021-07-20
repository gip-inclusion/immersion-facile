import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Provider } from "react-redux";
import { HttpTodoGateway } from "src/core-logic/adapters/HttpTodoGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { App } from "./App";

const gateway = import.meta.env.VITE_GATEWAY;

console.log("GATEWAY : ", gateway);

const todoGateway =
  gateway === "HTTP" ? new HttpTodoGateway() : new InMemoryTodoGateway();

const store = configureReduxStore({ todoGateway });

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
