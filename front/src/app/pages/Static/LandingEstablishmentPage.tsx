import bubbles from "/bulles.svg";
import checked from "/checked.svg";
import greatings from "/greatings.png";
import tandem from "/tandem.png";
import React, { useEffect } from "react";

import {
  BulletPointArrow,
  Card,
  Colored,
  Title,
} from "react-design-system/immersionFacile";
import arrow from "/fleche.svg";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { EstablishmentImmersionHowTo } from "src/uiComponents/ImmersionHowTo";
import { Statistic } from "src/uiComponents/Statistic";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import logoLeMoisLesEntreprises from "../../../assets/logo-le-mois-les-entreprises.svg";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import { useDispatch } from "react-redux";
import { SiretFetcherInput } from "src/app/components/SiretFetcherInput";

export const LandingEstablishmentPage = () => {
  const featureFlags = useFeatureFlags();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(establishmentSlice.actions.gotReady());
  }, []);
  return (
    <HeaderFooterLayout>
      <section className="flex flex-col items-center w-full py-10 bg-gradient-to-b from-immersionBlue-dark via-immersionBlue to-immersionBlue-light relative">
        <div
          className="w-48 absolute invisible md:visible sm:left-5 md:left-20 top-10 bottom-0 z-10"
          style={{
            backgroundImage: `url(${bubbles})`,
            backgroundSize: "100%",
            filter: "blur(4px)",
          }}
        />
        <h1 className="text-4xl text-center text-white font-bold max-w-x-lg fr-p-3w">
          Ouvrez vos entreprises aux immersions professionnelles&nbsp;!
        </h1>
        {!featureFlags.enableTemporaryOperation && (
          <a
            {...routes.formEstablishment().link}
            className="fr-btn fr-btn--establishment-secondary"
          >
            Référencer votre entreprise
          </a>
        )}
      </section>
      {featureFlags.enableTemporaryOperation && (
        <div className="fr-container fr-pt-4w fr-text--light">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-lg-4 fr-col-8 fr-col-md-6 fr-pt-6w fr-pl-6w fr-pr-6w fr-pb-1v fr-pb-sm-6w">
              <div className="logo-le-mois">
                <img
                  src={logoLeMoisLesEntreprises}
                  alt="Le mois - Les entreprises s'engagent"
                />
                <p className={"text-center fr-text--sm fr-pt-2w"}>
                  En savoir plus sur{" "}
                  <a
                    href={"#"}
                    className={"text-immersionBlue-dark"}
                    target={"_blank"}
                  >
                    #LeMois2022
                  </a>
                </p>
              </div>
            </div>
            <div className="fr-col-lg-8 fr-col-12 fr-p-2w fr-pt-4w">
              <h2 className="fr-mb-1w text-immersionBlue-dark">
                <strong>Rendez-vous</strong>
                <br />
                le mardi 4 octobre 2022
              </h2>
              <p className="fr-text--lg fr-mb-5w">
                pour l’événement de lancement du MOIS « Les entreprises
                s’engagent ».
              </p>
              <div className="fr-grid-row">
                <SiretFetcherInput
                  label={"Entrez votre SIRET pour référencer votre entreprise"}
                  placeholder={"Ex: 123 456 789 01238"}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col items-center">
        <Title>
          Pourquoi se référencer comme entreprise ouverte aux immersions ?
        </Title>
        <div
          className="flex flex-wrap justify-center"
          style={{ minWidth: "420px" }}
        >
          <Card
            imageUrl={checked}
            boldText="Faire connaître vos métiers"
            text="et l'environnement de travail"
          />
          <Card
            imageUrl={checked}
            boldText="Évaluer les candidats potentiels"
            text="en situation professionnelle réelle"
          />
          <Card
            imageUrl={checked}
            boldText="Pré-sourcer des profils invisibles"
            text="en cas de recrutement classique"
          />
          <Card
            imageUrl={checked}
            boldText="Renforcer une démarche inclusive"
            text="au sein des équipes"
          />
        </div>
        <section className="flex flex-col items-center fr-mt-4w mx-3 sm:mx-20">
          <Title>Ce que l'immersion facilitée tente de résoudre ...</Title>
          <div className="flex justify-center sm:justify-between flex-wrap">
            <Statistic
              title="... pour les entreprises ?"
              subtitle="Il est difficile de découvrir de nouveaux talents."
              stat={81}
              text="des employeurs utilisant l'immersion professionnelle déclarent qu'ils cherchent à repérer un futur collaborateur."
            />
            <div
              className="w-64 h-44"
              style={{
                backgroundImage: `url(${greatings})`,
                backgroundSize: "cover",
              }}
            />
            <Statistic
              title="... pour les candidats ?"
              subtitle="Il est difficile d'essayer un nouveau métier"
              stat={89}
              text="des demandeurs d'emploi assurent avoir cherché une entreprise d'accueil seuls ou avoir fait appel à leur réseau."
            />
          </div>
        </section>
        <a
          {...routes.formEstablishment().link}
          className="fr-btn fr-btn--establishment fr-my-3w"
        >
          Référencer votre entreprise
        </a>
      </section>
      <section className="flex flex-col items-center">
        <Title>
          Qu'est-ce qu'une immersion professionnelle (période de mise en
          situation en milieu professionnel - PMSMP) ?
        </Title>
        <div className="flex max-w-3xl items-end flex-wrap justify-center">
          <div
            className="h-60 w-72"
            style={{
              backgroundImage: `url(${tandem})`,
              backgroundSize: "cover",
            }}
          />
          <div className="flex-1 max-w-md" style={{ minWidth: "250px" }}>
            <BulletPointArrow arrowSvgUrl={arrow}>
              C'est une <Colored>période courte et non rémunérée</Colored> en
              entreprise.
            </BulletPointArrow>
            <BulletPointArrow arrowSvgUrl={arrow}>
              Cela permet de <Colored>découvrir un métier</Colored> et un
              environnement de travail tout en vérifiant des compétences et
              aptitudes auprès d'un professionnel en activité.
            </BulletPointArrow>
            <BulletPointArrow arrowSvgUrl={arrow}>
              Le bénéficiaire <Colored>conserve son statut initial</Colored> et
              est couvert par un prescripteur (Pôle emploi, Cap Emploi, Mission
              Locale, etc) grâce à la{" "}
              <a {...routes.conventionImmersion().link}>
                signature d'une convention
              </a>
              .
            </BulletPointArrow>
          </div>
        </div>
      </section>
      <EstablishmentImmersionHowTo />
    </HeaderFooterLayout>
  );
};
