import React from "react";
import { Navigation } from "src/app/Navigation";
import { Router } from "src/app/Router";
import { ENV } from "src/environmentVariables";

const { dev } = ENV;

export const App = () => (
  <>
    {dev && <Navigation />}
    <Router />
  </>
);
