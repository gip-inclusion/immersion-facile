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
      <p className="fr-my-2w">
        Le code d'autorisation retourné par Pôle Emploi ne permet pas d'avoir
        accès aux droits nécessaires pour lier votre compte.
      </p>

      <button
        className="text-immersionBlue-dark font-sans text-center"
        onClick={redirectToConventionWithoutIdentityProvider}
      >
        {" "}
        Vous pouvez quand même remplir votre demande de convention en indiquant
        l'agence Pole Emploi à laquelle vous êtes rattaché ici.{" "}
      </button>
      <p className="fr-my-2w">
        En cas de questionnement, n'hésitez pas à nous contacter par email sur
        <a href="mailto:contact@immersion-facile.com">
          contact@immersion-facile.com
        </a>
      </p>
    </div>
  );
};
