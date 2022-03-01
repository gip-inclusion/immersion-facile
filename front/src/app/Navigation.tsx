import React from "react";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { routes } from "src/app/routes";

export const Navigation = () => {
  const featureFlags = useFeatureFlagsContext();

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
