import React from "react";
import { ConventionMagicLinkPayload } from "shared";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { routes } from "src/app/routes/routes";
import { useConvention } from "src/app/hooks/convention.hooks";
import { ConventionValidation } from "src/app/components/admin/ConventionValidation";
import { NpsSection } from "../nps/NpsSection";
import { ConventionManageActions } from "./ConventionManageActions";

type ConventionManageContentProps = {
  jwt: string;
};

export const ConventionManageContent = ({
  jwt,
}: ConventionManageContentProps): JSX.Element => {
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention(jwt);
  const { role } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(jwt);

  if (fetchConventionError) {
    if (fetchConventionError.includes("Le lien magique est périmé")) {
      routes
        .renewConventionMagicLink({
          expiredJwt: jwt,
          originalURL: window.location.href,
        })
        .replace();
    }
    routes
      .errorRedirect({
        title: "Erreur lors de la récupération de la convention",
        message: fetchConventionError,
        kind: "",
      })
      .push();
  }

  return (
    <>
      {isLoading ? (
        <p>Chargement en cours...</p>
      ) : !convention ? (
        <p>Pas de conventions correspondante trouvée</p>
      ) : (
        <>
          <ConventionValidation convention={convention} />
          <ConventionManageActions
            convention={convention}
            role={role}
            submitFeedback={submitFeedback}
          />
          <NpsSection convention={convention} role={role} />
        </>
      )}
    </>
  );
};
