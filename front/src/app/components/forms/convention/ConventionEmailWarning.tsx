import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

export const ConventionEmailWarning = () => (
  <Alert
    small
    severity="info"
    className={fr.cx("fr-mb-2w")}
    description="Cette adresse email sera utilisée dans le cadre de la signature de la
  convention d'immersion. Pensez à bien vérifier son exactitude."
  />
);
