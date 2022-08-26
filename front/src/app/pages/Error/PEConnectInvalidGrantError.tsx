import React from "react";
import { useRedirectToConventionWithoutIdentityProvider } from "src/hooks/redirections.hooks";

export const PEConnectInvalidGrantError = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();

  return (
    <div role="alert" className={`fr-alert fr-alert--warning`}>
      <p className="fr-alert__title">
        Le code d'autorisation retourné par Pôle Emploi Connect ne permet pas de
        vous identifier.
      </p>
      Le code d'autorisation retourné par Pôle Emploi ne permet pas d'avoir
      accès aux droits nécessaires pour lier votre compte.
      <br />
      <br />
      <button
        className="text-immersionBlue-dark font-sans text-center"
        onClick={redirectToConventionWithoutIdentityProvider}>
        {" "}
        Vous pouvez quand même remplir votre demande de convention en indiquant
        l'agence Pole Emploi à laquelle vous êtes rattaché ici.{" "}
      </button>
      <br />
      <br />
      En cas de questionnement, n'hésitez pas à nous contacter par email sur
      <br />
      <a href="mailto:contact@immersion-facile.com">
        contact@immersion-facile.com
      </a>
    </div>
  );
};
