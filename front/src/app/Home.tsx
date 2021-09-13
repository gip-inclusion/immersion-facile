import React from "react";
import { ENV } from "src/environmentVariables";

const DebugInfo = () => (
  <div>
    <br />
    Env variables are:
    <br />
    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName} style={{ width: "400px" }}>
        {envName}: {JSON.stringify(envValue, null, 2)}
      </div>
    ))}
  </div>
);

type HomeProps = {
  showDebugInfo: boolean;
};

export const Home = ({ showDebugInfo }: HomeProps) => (
  <div>Welcome to the app !{showDebugInfo && <DebugInfo />}</div>
);
