import React from "react";
import { useRedirectToConventionWithoutIdentityProvider } from "src/hooks/redirections.hooks";

export const PEConnectAdvisorForbiddenAccess = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();
  return (
    <div role="alert" className={`fr-alert fr-alert--warning`}>
      <p className="fr-alert__title">
        Pôle Emploi Connect refuse la connection
      </p>
      Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse la
      récupération de vos conseillers référents. Nous travaillons activement à
      la résolution de ce problème avec le service technique Pôle Emploi.
      <br />
      <br />
      <button
        className="text-immersionBlue-dark font-sans text-center"
        onClick={redirectToConventionWithoutIdentityProvider}
      >
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
