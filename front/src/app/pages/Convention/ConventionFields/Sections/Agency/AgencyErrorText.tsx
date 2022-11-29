import React from "react";

export type AgencyErrorTextProperties = {
  loadingError: boolean;
  userError: string | boolean | undefined;
  error: string | undefined;
};

export const AgencyErrorText = ({
  loadingError,
  userError,
  error,
}: AgencyErrorTextProperties): JSX.Element => (
  <p id={`agency-code-{name}-error-desc-error`} className="fr-error-text">
    {loadingError
      ? "Erreur de chargement de la liste. Veuillez réessayer plus tard."
      : ""}
    {userError ? error : ""}
  </p>
);
