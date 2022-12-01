import React from "react";
import { Notification } from "react-design-system";

export const ConventionEmailWarning = () => (
  <Notification title={""} type={"info"} className="fr-mb-2w">
    Cette adresse email sera utilisée dans le cadre de la signature de la
    convention d'immersion. Pensez à bien vérifier son exactitude.
  </Notification>
);
