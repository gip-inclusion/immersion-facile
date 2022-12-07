import React from "react";
import { routes } from "src/app/routes/routes";

export const PEConnectConnectionAborted = () => (
  <div role="alert" className={`fr-alert fr-alert--warning`}>
    <p className="fr-alert__title">
      La connexion à Pôle Emploi Connect a étée interrompue.
    </p>
    <p className="fr-my-2w">Veuillez réessayer.</p>
    <button
      className="text-immersionBlue-dark font-sans"
      onClick={() => {
        routes.home().push();
      }}
    >
      {" "}
      Revenir à la page d'accueil.{" "}
    </button>
    <p className="fr-my-2w">
      En cas de questionnement, n'hésitez pas à nous contacter par email sur
      <a href="mailto:contact@immersion-facile.com">
        contact@immersion-facile.com
      </a>
    </p>
  </div>
);
