import React from "react";
import { immersionFacileContactEmail } from "shared";
import { Notification } from "react-design-system";
import { routes } from "src/app/routes/routes";

export const PEConnectConnectionAborted = () => (
  <Notification
    title="La connexion à Pôle Emploi Connect a été interrompue."
    type="warning"
  >
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
      <a href={`mailto:${immersionFacileContactEmail}`}>
        {immersionFacileContactEmail}
      </a>
    </p>
  </Notification>
);
