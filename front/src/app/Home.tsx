import React from "react";
import { ENV } from "src/environmentVariables";

export const Home = () => (
  <div>
    Welcome to the app ! Env variables are:
    <br />
    <br />
    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName}>
        {envName}: {JSON.stringify(envValue)}
      </div>
    ))}
  </div>
);
