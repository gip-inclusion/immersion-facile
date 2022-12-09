import React from "react";
import { routes } from "src/app/routes/routes";
import { Notification } from "react-design-system";
import { immersionFacileContactEmail } from "shared";

export const PEConnectNoAuthorisation = () => (
  <Notification
    title="Vous n'avez pas accordé les autorisations nécessaires à Pôle Emploi
    Connect."
    type="warning"
  >
    <p className="fr-my-2w">
      Vous avez refusé d'accorder les autorisations nécessaires sur l'interface
      Pôle Emploi Connect.
    </p>
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
