import React from "react";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";
import { Notification } from "react-design-system";
import { immersionFacileContactEmail } from "shared";

export const PEConnectInvalidGrantError = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();
  return (
    <Notification
      title="Le code d'autorisation retourné par Pôle Emploi Connect ne permet pas de
      vous identifier."
      type="warning"
    >
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
        <a href={`mailto:${immersionFacileContactEmail}`}>
          {immersionFacileContactEmail}
        </a>
      </p>
    </Notification>
  );
};
