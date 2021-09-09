import React from "react";
import { ENV } from "src/environmentVariables";

export const Home = () => (
  <div>
    Welcome to the app ! Env variables are:
    <br />
    <br />
    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName} style={{ width: "400px" }}>
        {envName}: {JSON.stringify(envValue, null, 2)}
      </div>
    ))}
  </div>
);
