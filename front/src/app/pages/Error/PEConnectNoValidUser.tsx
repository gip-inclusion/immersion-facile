import React from "react";

export const PEConnectNoValidUser = () => (
  <div role="alert" className={`fr-alert fr-alert--warning`}>
    <p className="fr-alert__title">
      Les données retournées par Pôle Emploi Connect ne permettent pas de vous
      identifier.
    </p>
    Les données retournées par Pôle Emploi ne permettent pas de vous identifier.
    <br />
    <a href="https://immersion-facile.beta.gouv.fr/demande-immersion&federatedIdentity=none">
      {" "}
      Vous pouvez quand même remplir votre demande de convention en indiquant
      l'agence Pôle Emploi à laquelle vous êtes rattaché ici.{" "}
    </a>
    <br />
    En cas de questionnement,{" "}
    <a href="mailto:contact@immersion-facile.com">
      n'hésitez pas à nous contacter par email ici.
    </a>
  </div>
);
