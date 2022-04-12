import React from "react";
import { Provider } from "react-redux";
import { store } from "src/app/config/dependencies";
import { ENV } from "src/environmentVariables";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";

const { envType } = ENV;

export const App = () => (
  <Provider store={store}>
    {envType === "DEV" && <Navigation />}
    <Router />
  </Provider>
);
