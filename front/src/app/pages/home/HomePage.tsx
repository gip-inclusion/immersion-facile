import React from "react";
import { EstablishmentHomeMenu } from "src/app/components/EstablishmentHomeMenu";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { FindImmersionHomeMenu } from "src/app/components/FindImmersionHomeMenu";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { ENV } from "src/environmentVariables";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";
import { MainWrapper } from "react-design-system/immersionFacile";

const { frontEnvType } = ENV;
const DebugInfo = () => (
  <div
    style={{
      position: "fixed",
      top: "1rem",
      right: "1rem",
      backgroundColor: "rgba(255,255,255,.8)",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,.1)",
      zIndex: 10,
      padding: "1rem",
      fontSize: ".75rem",
    }}>
    <h3>Env variables are:</h3>

    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName}>
        {envName}: <strong>{JSON.stringify(envValue, null, 2)}</strong>
      </div>
    ))}
  </div>
);

export const HomePage = () => (
  <div>
    {frontEnvType === "DEV" && <DebugInfo />}
    <ImmersionMarianneHeader />
    <MainWrapper className="bg-gradient-to-b from--100 from-gray-100 via-gray-50 to-white pt-14">
      <section className="flex flex-col items-center">
        <div
          className="flex flex-wrap justify-center "
          style={{ minWidth: "420px" }}>
          <div>
            <FindImmersionHomeMenu />
            <InitiateConventionCard />
          </div>
          <EstablishmentHomeMenu />
        </div>
      </section>
      <HomeImmersionHowTo />
    </MainWrapper>

    <ImmersionFooter />
  </div>
);
