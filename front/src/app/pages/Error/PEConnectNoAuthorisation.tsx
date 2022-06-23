import React from "react";

export const PEConnectNoAuthorisation = () => (
  <div role="alert" className={`fr-alert fr-alert--warning`}>
    <p className="fr-alert__title">
      Vous n'avez pas accordé les autorisations nécessaires à Pôle Emploi
      Connect.
    </p>
    Vous avez refusé d'accorder les autorisations nécessaires sur l'interface
    Pôle Emploi Connect.
    <br />
    <a href="https://immersion-facile.beta.gouv.fr">
      {" "}
      Revenir à la page d'accueil.{" "}
    </a>
    <br />
    En cas de questionnement,{" "}
    <a href="mailto:contact@immersion-facile.com">
      n'hésitez pas à nous contacter par email ici.
    </a>
  </div>
);
