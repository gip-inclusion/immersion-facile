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
    <a {...routes.immersionOffer().link}>Formulaire Entreprise {" - "}</a>
    <a {...routes.todos().link}>Todo list</a>
  </nav>
);
