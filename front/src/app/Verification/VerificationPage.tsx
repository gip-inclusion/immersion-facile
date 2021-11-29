import React, { useState } from "react";
import { routes } from "src/app/routes";
import { useImmersionApplicationFromJwt } from "src/app/sharedHooks/useImmersionApplicationFromJwt";
import { VerificationActionButton } from "src/app/Verification/VerificationActionButton";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { ApplicationStatus } from "src/shared/ImmersionApplicationDto";
import {
  statusTransitionConfigsLegacy,
  statusTransitionConfigsEnterpriseSign,
} from "src/shared/immersionApplicationStatusTransitions";
import { frontRoutes } from "src/shared/routes";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { Route } from "type-route";
import { ENV } from "src/environmentVariables";

const { featureFlags, dev } = ENV;

type VerificationPageProps = {
  route: Route<typeof routes.immersionApplicationsToValidate>;
};

const getHighestActingRole = (roles: Role[]) => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("validator")) return "validator";
  if (roles.includes("counsellor")) return "counsellor";
  return undefined;
};

const isAllowedTransition = (
  initialStatus: ApplicationStatus | undefined,
  targetStatus: ApplicationStatus,
  actingRole: Role,
) => {
  const statusTransitionConfigs = featureFlags.enableEnterpriseSignature
    ? statusTransitionConfigsEnterpriseSign
    : statusTransitionConfigsLegacy;
  const transitionConfig = statusTransitionConfigs[targetStatus];
  if (!transitionConfig) return false;
  if (
    transitionConfig.validInitialStatuses.filter(
      (status) => status === initialStatus,
    ).length === 0
  )
    return false;
  if (
    transitionConfig.validRoles.filter((role) => role === actingRole).length ===
    0
  )
    return false;
  return true;
};

export const VerificationPage = ({ route }: VerificationPageProps) => {
  const {
    immersionApplication,
    roles,
    applicationId,
    jwt,
    needsMagicLinkRefresh,
  } = useImmersionApplicationFromJwt(route.params.jwt);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const actingRole = getHighestActingRole(roles);
  const currentStatus =
    immersionApplication?.status ?? ("UNKNOWN" as ApplicationStatus);
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

  const sentForModificationSuccessfully =
    "La demande d'immersion a bien été renvoyée pour modification";
  const validatedSuccessfully =
    "La confirmation de l'immersion a bien été programmée pour envoi";

  if (needsMagicLinkRefresh) {
    location.href =
      location.origin +
      "/" +
      frontRoutes.magicLinkRenewal +
      "?" +
      "id=" +
      applicationId +
      "&role=" +
      roles[0] +
      "&originalURL=" +
      encodeURIComponent(location.origin + location.pathname + "?jwt=%jwt%");
  }

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
        {isAllowedTransition(
          immersionApplication?.status,
          "REJECTED",
          actingRole,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="REJECTED"
            messageToShowOnSuccess="La demande d'immersion a bien été refusé"
          >
            Refuser l'immersion ...
          </VerificationActionButton>
        )}

        {isAllowedTransition(
          immersionApplication?.status,
          "DRAFT",
          actingRole,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="DRAFT"
            messageToShowOnSuccess={sentForModificationSuccessfully}
          >
            Renvoyer au bénéficiaire pour modification
          </VerificationActionButton>
        )}
        {isAllowedTransition(
          immersionApplication?.status,
          "ACCEPTED_BY_COUNSELLOR",
          actingRole,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="ACCEPTED_BY_COUNSELLOR"
            messageToShowOnSuccess={validatedSuccessfully}
            disabled={!!successMessage || currentStatus != "IN_REVIEW"}
          >
            {currentStatus === "ACCEPTED_BY_COUNSELLOR"
              ? "Demande déjà validée."
              : "Marquer la demande comme éligible"}
          </VerificationActionButton>
        )}
        {isAllowedTransition(
          immersionApplication?.status,
          "ACCEPTED_BY_VALIDATOR",
          actingRole,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="ACCEPTED_BY_VALIDATOR"
            messageToShowOnSuccess={validatedSuccessfully}
            disabled={
              !!successMessage ||
              (currentStatus != "IN_REVIEW" &&
                currentStatus != "ACCEPTED_BY_COUNSELLOR")
            }
          >
            {currentStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Demande déjà validée"
              : "Valider la demande"}
          </VerificationActionButton>
        )}
        {isAllowedTransition(
          immersionApplication?.status,
          "VALIDATED",
          actingRole,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="VALIDATED"
            messageToShowOnSuccess={validatedSuccessfully}
            disabled={
              !!successMessage || currentStatus != "ACCEPTED_BY_VALIDATOR"
            }
          >
            {currentStatus === "VALIDATED"
              ? "Convention envoyée."
              : "Envoyer la convention"}
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
