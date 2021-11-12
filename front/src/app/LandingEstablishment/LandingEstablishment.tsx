import React from "react";
import { routes } from "src/app/routes";
import bubbles from "src/assets/bulles.svg";
import greatings from "src/assets/greatings.png";
import immersionFacileLogo from "src/assets/logo-immersion-facile.svg";
import tandem from "src/assets/tandem.png";
import { BulletPoint } from "src/components/BulletPoint";
import { Card } from "src/components/Card";
import { Colored } from "src/components/Colored";
import { Footer } from "src/components/Footer";
import { MarianneLogo } from "src/components/MarianneHeader";
import { Statistic } from "src/components/Statistic";
import { Title } from "src/components/Title";

export const LandingEstablishment = () => (
  <div>
    <section className="flex justify-between mx-3 sm:mx-20">
      <MarianneLogo />
      <img src={immersionFacileLogo} alt="Logo Immersion-Facile" />
    </section>
    <section className="flex flex-col items-center w-full py-10 mt-5 bg-gradient-to-b from-immersionBlue-dark via-immersionBlue to-immersionBlue-light relative">
      <div
        className="w-48 absolute invisible md:visible sm:left-5 md:left-20 top-10 bottom-0 z-10"
        style={{
          backgroundImage: `url(${bubbles})`,
          backgroundSize: "100%",
          filter: "blur(4px)",
        }}
      />
      <div className="text-white">ENTREPRISE</div>
      <div className="text-4xl text-center text-white font-bold max-w-sm py-6">
        Ouvrez vos entreprises aux immersions professionnelles !
      </div>
      <a
        {...routes.formEstablishment().link}
        className="no-underline shadow-none bg-white py-3 px-8 rounded-md text-immersionBlue-dark"
        target="_blank"
      >
        Référencer votre entreprise
      </a>
    </section>
    <section className="flex flex-col items-center mx-3 sm:mx-20">
      <Title>Ce que l'immersion facile tente de résoudre ...</Title>
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
    <section className="flex flex-col items-center">
      <Title>
        Pourquoi se référencer comme entreprise ouverte aux immersions ?
      </Title>
      <div
        className="flex flex-wrap justify-center"
        style={{ minWidth: "420px" }}
      >
        <Card
          boldText="Faire connaître vos métiers"
          text="et l'environnement de travail"
        />
        <Card
          boldText="Évaluer les candidats potentiels"
          text="en situation professionnelle réelle"
        />
        <Card
          boldText="Pré-sourcer des profils invisible"
          text="en cas de recrutement classique"
        />
        <Card
          boldText="Renforcer une démarche inclusive"
          text="au sein des équipes"
        />
      </div>
      <a
        {...routes.formEstablishment().link}
        className="no-underline shadow-none bg-immersionBlue py-3 px-8 rounded-md text-white font-semibold my-3"
        target="_blank"
      >
        Référencer votre entreprise
      </a>
    </section>
    <section className="flex flex-col items-center">
      <Title>
        Qu'est-ce qu'une immersion professionnelle (période de mise en situation
        en milieu professionnel - PMSMP) ?
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
          <BulletPoint>
            C'est une <Colored>période courte et non rémunérée</Colored> en
            entreprise.
          </BulletPoint>
          <BulletPoint>
            Cela permet de <Colored>découvrir un métier</Colored> et un
            environnement de travail tout en vérifiant des compétences et
            aptitudes auprès d'un professionnel en activité.
          </BulletPoint>
          <BulletPoint>
            Le bénéficiaire <Colored>conserve son statut initial</Colored> et
            est couvert par un prescripteur (Pôle emploi, Cap Emploi, Mission
            Locale, etc) grâce à la{" "}
            <a {...routes.immersionApplication().link} target="_blank">
              signature d'une convention
            </a>
            .
          </BulletPoint>
        </div>
      </div>
    </section>
    <section className="flex flex-col items-center">
      <Title red>L'immersion facile, comment ça fonctionne ?</Title>
      <div className="flex max-w-7xl flex-wrap justify-center items-center">
        <div className="max-w-xs" style={{ minWidth: "250px" }}>
          <BulletPoint red num={1}>
            <Colored red>Sélectionnez les métiers</Colored> pour lesquels chaque
            établissement peut accueillir en immersion et préciser un contact
            "référent immersion professionnelle".
          </BulletPoint>
          <BulletPoint red num={2}>
            <Colored red>Recevez les demandes</Colored> des candidats à la
            recherche d'opportunités d'immersion.
          </BulletPoint>
          <BulletPoint red num={3}>
            <Colored red>Signer la convention</Colored> avec le candidat et
            débuter l'immersion professionnelle.
          </BulletPoint>
        </div>
        <div
          className="pl-4 flex flex-col items-center"
          style={{ width: "480px" }}
        >
          <div className="text-immersionRed-dark font-semibold text-center py-4">
            L'immersion professionnelle, mode d'emploi
          </div>
          <div className="border-blue-200 border border-solid">
            <iframe
              width="480"
              height="270"
              src="https://www.powtoon.com/embed/e1lglPbeknD/"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);
