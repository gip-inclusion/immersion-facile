import React from "react";
import { Notification } from "react-design-system";
import { fr } from "@codegouvfr/react-dsfr";

export const ConventionEmailWarning = () => (
  <Notification title={""} type={"info"} className={fr.cx("fr-mb-2w")}>
    Cette adresse email sera utilisée dans le cadre de la signature de la
    convention d'immersion. Pensez à bien vérifier son exactitude.
  </Notification>
);
