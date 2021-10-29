import React from "react";
import ReactDOM from "react-dom";
import { App } from "src/app/App";
import "./index.css";
import { RouteProvider } from "./routes";

ReactDOM.render(
  <React.StrictMode>
    <RouteProvider>
      <App />
    </RouteProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
