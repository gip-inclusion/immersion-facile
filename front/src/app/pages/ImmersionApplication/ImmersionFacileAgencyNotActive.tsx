import React from "react";

export const ImmersionFacileAgencyNotActive = () => (
  <div role="alert" className="fr-alert fr-alert--info w-5/6 m-auto mt-10">
    <p className="fr-alert__title">
      L'agence 'Immersion Facile' n'est pas active.
    </p>
    <p>
      Veuillez contacter l'équipe immersion facile{" "}
      <a>contact@immersion-facile@beta.gouv.fr</a> pour le support utilisateur.
    </p>
  </div>
);
