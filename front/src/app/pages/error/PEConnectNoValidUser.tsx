import React from "react";
import { Notification } from "react-design-system";
import { immersionFacileContactEmail } from "shared";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";

export const PEConnectNoValidUser = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();

  return (
    <Notification
      title="Les données retournées par Pôle Emploi Connect ne permettent pas de vous
      identifier."
      type="warning"
    >
      <p className="fr-my-2w">
        Les données retournées par Pôle Emploi ne permettent pas de vous
        identifier.
      </p>
      <button
        className="text-immersionBlue-dark font-sans"
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
