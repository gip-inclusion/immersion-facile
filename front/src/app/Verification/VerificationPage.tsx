import React, { useState } from "react";
import { routes } from "src/app/routes";
import { useImmersionApplicationFromJwt } from "src/app/sharedHooks/useImmersionApplicationFromJwt";
import { VerificationActionButton } from "src/app/Verification/VerificationActionButton";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { Route } from "type-route";

type VerificationPageProps = {
  route: Route<typeof routes.immersionApplicationsToValidate>;
};

const getHighestActingRole = (roles: Role[]) => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("validator")) return "validator";
  if (roles.includes("counsellor")) return "counsellor";
  return undefined;
};

export const VerificationPage = ({ route }: VerificationPageProps) => {
  const { immersionApplication, roles, jwt } = useImmersionApplicationFromJwt(
    route.params.jwt,
  );
  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const actingRole = getHighestActingRole(roles);
  if (!actingRole)
    return <div>Vous n'êtes pas autorisé à accéder à cette page"</div>;

  const disabled = !!successMessage;

  const buttonProps = {
    disabled,
    immersionApplication,
    jwt,
    onSuccess: setSuccessMessage,
    onError: setErrorMessage,
  };

  const validatedSuccessfully = "La demande d'immersion a bien été mise à jour";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {immersionApplication ? (
        <FormAccordion immersionApplication={immersionApplication} />
      ) : (
        "Chargement en cours..."
      )}
      <div>
        <VerificationActionButton
          {...buttonProps}
          newStatus="REJECTED"
          messageToShowOnSuccess="La demande d'immersion a bien été refusé"
        >
          Refuser l'immersion ...
        </VerificationActionButton>

        {actingRole === "counsellor" && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="ACCEPTED_BY_COUNSELLOR"
            messageToShowOnSuccess={validatedSuccessfully}
          >
            Marquer la demande comme légitime
          </VerificationActionButton>
        )}
        {actingRole === "validator" && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="ACCEPTED_BY_VALIDATOR"
            messageToShowOnSuccess={validatedSuccessfully}
          >
            Valider la demande
          </VerificationActionButton>
        )}
        {actingRole === "admin" && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="VALIDATED"
            messageToShowOnSuccess={validatedSuccessfully}
          >
            Valider et envoyer la convention
          </VerificationActionButton>
        )}

        {errorMessage && (
          <ErrorMessage title="Désolé: Erreur de traitement sur la plateforme, veuillez réessayer ultérieurement">
            {errorMessage}
          </ErrorMessage>
        )}

        {successMessage && (
          <SuccessMessage title="Succès">{successMessage}</SuccessMessage>
        )}
      </div>
    </div>
  );
};
