import React from "react";
import { EstablishmentHomeMenu } from "src/app/components/EstablishmentHomeMenu";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionHomeMenu } from "src/app/components/ImmersionHomeMenu";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { ENV } from "src/environmentVariables";
import { clientApplication } from "src/infra/application/application";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";

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

export const HomePage = ({ showDebugInfo }: HomeProps) => (
  <div className="relative">
    <div
      className="absolute left-0 top-0 right-0 bottom-0 "
      style={{ zIndex: -1 }}
    >
      <div className="bg-white w-full h-48" />
      <div className="bg-red-50 w-full h-full bg-gradient-to-b from-gray-100 via-gray-50 to-white" />
    </div>
    {showDebugInfo && <DebugInfo />}
    <ImmersionMarianneHeader />
    <section className="flex flex-col items-center mt-14">
      <div
        className="flex flex-wrap justify-center "
        style={{ minWidth: "420px" }}
      >
        <ImmersionHomeMenu />
        <EstablishmentHomeMenu clientApplication={clientApplication} />
      </div>
    </section>
    <HomeImmersionHowTo />
    <ImmersionFooter />
  </div>
);
