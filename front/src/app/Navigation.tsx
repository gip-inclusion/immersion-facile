import React from "react";
import { routes } from "src/app/routes";
import { ENV } from "src/environmentVariables";

const { featureFlags } = ENV;

export const Navigation = () => (
  <nav>
    <a {...routes.home().link}>Home</a>
    {" - "}
    <a {...routes.immersionApplication().link}>Demande immersion</a>
    {" - "}
    {featureFlags.enableAdminUi && <a {...routes.admin().link}>Backoffice</a>}
    {featureFlags.enableAdminUi && " - "}
    <a {...routes.formEstablishment().link}>Formulaire Entreprise</a> {" - "}
    <a {...routes.landingEstablishment().link}>Landing entreprise </a> {" - "}
    <a {...routes.search().link}>Recherche</a>
  </nav>
);
