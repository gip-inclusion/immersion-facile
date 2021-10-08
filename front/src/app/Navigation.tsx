import React from "react";
import { routes } from "src/app/routes";
import { ENV } from "src/environmentVariables";

const { featureFlags } = ENV;

export const Navigation = () => (
  <nav>
    <a {...routes.home().link}>Home</a>
    {" - "}

    {featureFlags.enableGenericApplicationForm && (
      <a {...routes.immersionApplication().link}>Demande immersion</a>
    )}
    {featureFlags.enableGenericApplicationForm && " - "}

    {featureFlags.enableBoulogneSurMerApplicationForm && (
      <a {...routes.boulogneSurMer().link}>Boulogne-sur-Mer</a>
    )}
    {featureFlags.enableBoulogneSurMerApplicationForm && " - "}

    {featureFlags.enableNarbonneApplicationForm && (
      <a {...routes.narbonne().link}>Narbonne</a>
    )}
    {featureFlags.enableNarbonneApplicationForm && " - "}

    {featureFlags.enableAdminUi && <a {...routes.admin().link}>Backoffice</a>}
    {featureFlags.enableAdminUi && " - "}

    <a {...routes.immersionOffer().link}>Formulaire Entreprise {" - "}</a>

    <a {...routes.todos().link}>Todo list</a>
  </nav>
);
