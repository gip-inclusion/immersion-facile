import React from "react";
import { EstablishmentHomeMenu } from "src/app/components/EstablishmentHomeMenu";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionHomeMenu } from "src/app/components/ImmersionHomeMenu";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { ENV } from "src/environmentVariables";
import { clientApplication } from "src/infra/application/application";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";

const { frontEnvType } = ENV;
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

export const HomePage = () => (
  <div>
    {frontEnvType === "DEV" && <DebugInfo />}
    <ImmersionMarianneHeader />
    <div className="bg-gradient-to-b from--100 from-gray-100 via-gray-50 to-white pt-14">
      <section className="flex flex-col items-center">
        <div
          className="flex flex-wrap justify-center "
          style={{ minWidth: "420px" }}
        >
          <ImmersionHomeMenu />
          <EstablishmentHomeMenu clientApplication={clientApplication} />
        </div>
      </section>
      <HomeImmersionHowTo />
    </div>
    <ImmersionFooter />
  </div>
);
