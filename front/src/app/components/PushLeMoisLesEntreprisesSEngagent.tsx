import logoLeMoisLesEntreprises from "src/assets/logo-le-mois-les-entreprises.svg";
import { SiretFetcherInput } from "src/app/components/SiretFetcherInput";
import React from "react";

export const PushLeMoisLesEntreprisesSEngagent = () => (
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
              href={"https://lesentreprises-sengagent.gouv.fr/le-mois"}
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
          Devenez entreprise accueillante
        </h2>
        <p className="fr-text--lg fr-mb-5w">
          Ouvrez vos portes aux talents de demain
        </p>
        <div className="fr-grid-row">
          <SiretFetcherInput
            label={"Entrez votre SIRET pour référencer votre entreprise"}
            placeholder={"Ex: 123 456 789 01238"}
            shouldFetchEvenIfAlreadySaved={false}
          />
        </div>
      </div>
    </div>
  </div>
);
