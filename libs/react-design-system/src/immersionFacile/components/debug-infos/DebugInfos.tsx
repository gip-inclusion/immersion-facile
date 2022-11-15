import React from "react";
import "./DebugInfo.scss";

export const DebugInfo = (ENV: {
  dev: boolean;
  envType: string;
  gateway: "IN_MEMORY" | "HTTP";
  PREFILLED_FORMS: boolean;
  crispWebSiteId: string;
}) =>
  ["local", "dev"].includes(ENV.envType) && (
    <div className="im-debug-infos">
      <span className="im-debug-infos__title">Env variables are:</span>

      {Object.entries(ENV).map(([envName, envValue]) => (
        <div key={envName}>
          {envName}: <strong>{JSON.stringify(envValue, null, 2)}</strong>
        </div>
      ))}
    </div>
  );
