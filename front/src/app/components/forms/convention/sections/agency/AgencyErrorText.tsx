import { fr } from "@codegouvfr/react-dsfr";
import React from "react";

export type AgencyErrorTextProperties = {
  isFetchAgencyOptionsError: boolean;
  userError: string | boolean | undefined;
  error: string | undefined;
};

export const AgencyErrorText = ({
  isFetchAgencyOptionsError,
  userError,
  error,
}: AgencyErrorTextProperties): JSX.Element => (
  <p
    id={"agency-code-{name}-error-desc-error"}
    className={fr.cx("fr-error-text")}
  >
    {isFetchAgencyOptionsError
      ? "Erreur de chargement de la liste. Veuillez réessayer plus tard."
      : ""}
    {userError ? error : ""}
  </p>
);
