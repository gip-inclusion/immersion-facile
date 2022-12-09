import React from "react";
import { Notification } from "react-design-system";
import { immersionFacileContactEmail } from "shared";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";

export const PEConnectUserForbiddenAccess = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();
  return (
    <Notification
      title="Pôle Emploi Connect refuse la connection."
      type="warning"
    >
      <p className="fr-my-2w">
        Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse
        la récupération de vos informations. Nous travaillons activement à la
        résolution de ce problème avec le service technique Pôle Emploi.
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
