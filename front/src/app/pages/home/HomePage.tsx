import React from "react";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  FixedStamp,
  HeroHeader,
  HeroHeaderNavCard,
  MainWrapper,
  SectionFaq,
  SectionStats,
  SectionTextEmbed,
} from "react-design-system/immersionFacile";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { routes } from "src/app/routing/routes";
import logoLeMoisLesEntreprises from "/src/assets/img/logo-le-mois-les-entreprises.svg";
import {
  heroHeaderContent,
  heroHeaderNavCards,
  sectionFaqData,
  sectionStatsData,
} from "./data/content";
import { useDispatch } from "react-redux";
import { useEstablishmentSiret } from "src/hooks/siret.hooks";
import { SiretModal, useSiretModal } from "src/app/components/SiretModal";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";

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

export type UserType = "default" | "candidate" | "establishment" | "agency";

type HomePageProps = {
  type: UserType;
};

export const HomePage = ({ type }: HomePageProps) => {
  const featureFlags = useFeatureFlags();
  const storeDispatch = useDispatch();
  const shouldFetchEvenIfAlreadySaved = false;
  const { isReadyForRequestOrRedirection } = useEstablishmentSiret({
    shouldFetchEvenIfAlreadySaved,
  });
  const { modalState, dispatch: modalDispatch } = useSiretModal();
  const heroHeaderNavCardsWithDispatch = heroHeaderNavCards(
    storeDispatch,
    modalDispatch as Dispatch<AnyAction>,
  );
  const { title, subtitle, displayName, icon, illustration } =
    heroHeaderContent[type];
  return (
    <div>
      <ImmersionMarianneHeader />
      <MainWrapper layout="fullscreen" vSpacing={0} useBackground>
        <HeroHeader
          title={title}
          description={subtitle}
          illustration={illustration}
          type={type}
          typeDisplayName={displayName}
          icon={icon}
          patterns
          navCards={heroHeaderNavCardsWithDispatch[type] as HeroHeaderNavCard[]}
          parallax
          isReadyForRequestOrRedirection={isReadyForRequestOrRedirection}
          siretModal={
            <SiretModal modalState={modalState} dispatch={modalDispatch} />
          }
        />
        <SectionStats stats={sectionStatsData} />
        <SectionTextEmbed videoUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/" />
        <SectionFaq articles={sectionFaqData} />
      </MainWrapper>

      <ImmersionFooter />

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
