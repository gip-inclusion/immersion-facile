import React from "react";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";

export const PEConnectNoValidAdvisor = () => {
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();

  return (
    <div role="alert" className={`fr-alert fr-alert--warning`}>
      <p className="fr-alert__title">
        Impossible d'identifier votre conseiller référent
      </p>
      <p className="fr-my-2w">
        Les données retournées par Pôle Emploi ne permettent pas d'identifier le
        conseiller référent qui vous est dédié.
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
