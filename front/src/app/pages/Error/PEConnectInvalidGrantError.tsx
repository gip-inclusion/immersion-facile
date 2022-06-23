import React from "react";

export const PEConnectInvalidGrantError = () => (
  <div role="alert" className={`fr-alert fr-alert--warning`}>
    <p className="fr-alert__title">
      Le code d'autorisation retourné par Pôle Emploi Connect ne permet pas de
      vous identifier.
    </p>
    Le code d'autorisation retourné par Pôle Emploi ne permet pas d'avoir accès
    aux droits nécessaires pour lier votre compte.
    <br />
    <a href="https://immersion-facile.beta.gouv.fr/demande-immersion&federatedIdentity=none">
      {" "}
      Vous pouvez quand même remplir votre demande de convention en indiquant
      l'agence Pole Emploi à laquelle vous êtes rattaché ici.{" "}
    </a>
    <br />
    En cas de questionnement,{" "}
    <a href="mailto:contact@immersion-facile.com">
      n'hésitez pas à nous contacter par email ici.
    </a>
  </div>
);
