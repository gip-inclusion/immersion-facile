import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import "src/assets/index.css";
import { store } from "src/app/config/dependencies";
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
