import React from "react";
import { EstablishmentHomeMenu } from "src/app/components/EstablishmentHomeMenu";
import { FindImmersionHomeMenu } from "src/app/components/FindImmersionHomeMenu";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { InitiateConventionCard } from "src/app/components/InitiateConventionCard";
import { ENV } from "src/environmentVariables";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";
import { FixedStamp, MainWrapper } from "react-design-system/immersionFacile";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { routes } from "src/app/routing/routes";
import logoLeMoisLesEntreprises from "../../../assets/logo-le-mois-les-entreprises.svg";
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
      zIndex: 1000,
      padding: "1rem",
      fontSize: ".75rem",
      maxWidth: 300,
    }}
  >
    <span
      style={{
        fontWeight: "bold",
        fontSize: "1rem",
      }}
    >
      Env variables are:
    </span>

    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName}>
        {envName}: <strong>{JSON.stringify(envValue, null, 2)}</strong>
      </div>
    ))}
  </div>
);

export const HomePage = () => {
  const featureFlags = useFeatureFlags();
  return (
    <div>
      <ImmersionMarianneHeader />
      <MainWrapper className="bg-gradient-to-b from--100 from-gray-100 via-gray-50 to-white pt-14">
        <section className="flex flex-col items-center">
          <div className="flex flex-wrap justify-center">
            <div>
              <FindImmersionHomeMenu />
              <InitiateConventionCard
                title="J’ai trouvé mon entreprise accueillante"
                peConnectNotice="Je suis inscrit à Pôle Emploi, je demande une convention avec :"
                otherCaseNotice="Je suis accompagné par une autre structure :"
                showFormButtonLabel="Initier ma demande de convention"
              />
            </div>
            <EstablishmentHomeMenu />
          </div>
        </section>
        <HomeImmersionHowTo />
      </MainWrapper>

      <ImmersionFooter />
      {frontEnvType === "DEV" && <DebugInfo />}
      {featureFlags.enableTemporaryOperation && (
        <FixedStamp
          image={
            <img
              src={logoLeMoisLesEntreprises}
              alt="Le mois - Les entreprises s'engagent"
            />
          }
          overtitle="Devenez"
          title="entreprise accueillante"
          subtitle="Ouvrez vos portes aux talents de demain"
          link={routes.landingEstablishment().link}
        />
      )}
    </div>
  );
};
