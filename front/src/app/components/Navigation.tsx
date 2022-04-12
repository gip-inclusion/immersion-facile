import React from "react";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";

export const Navigation = () => {
  const featureFlags = useAppSelector(featureFlagsSelector);

  return (
    <nav>
      <a {...routes.home().link}>Home</a>
      {" - "}
      <a {...routes.immersionApplication().link}>Demande immersion</a>
      {" - "}
      {featureFlags.enableAdminUi && <a {...routes.admin().link}>Backoffice</a>}
      {featureFlags.enableAdminUi && " - "}
      <a {...routes.formEstablishment().link}>Formulaire Entreprise</a> {" - "}
      <a {...routes.landingEstablishment().link}>Landing entreprise </a> {" - "}
      <a {...routes.search().link}>Recherche</a> {" - "}
      <a {...routes.addAgency().link}>Ajouter agence</a>
    </nav>
  );
};
