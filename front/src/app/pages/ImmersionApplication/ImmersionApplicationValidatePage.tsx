import React, { useState } from "react";
import { immersionApplicationGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ApplicationStatus } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { statusTransitionConfigs } from "shared/src/immersionApplicationStatusTransitions";
import { MagicLinkPayload, Role } from "shared/src/tokens/MagicLinkPayload";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { ErrorMessage } from "src/uiComponents/form/ErrorMessage";
import { SuccessMessage } from "src/uiComponents/form/SuccessMessage";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import { VerificationActionButton } from "./VerificationActionButton";

type VerificationPageProps = {
  route: Route<typeof routes.immersionApplicationsToValidate>;
};

const isAllowedTransition = (
  initialStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  actingRole: Role,
) => {
  const transitionConfig = statusTransitionConfigs[targetStatus];

  return (
    transitionConfig.validInitialStatuses.includes(initialStatus) &&
    transitionConfig.validRoles.includes(actingRole)
  );
};

export const ImmersionApplicationValidatePage = ({
  route,
}: VerificationPageProps) => {
  const jwt = route.params.jwt;
  const { role } = decodeJwt<MagicLinkPayload>(jwt);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const disabled = !!successMessage;

  return (
    <ApiDataContainer
      callApi={() => immersionApplicationGateway.getMagicLink(jwt)}
      jwt={jwt}
    >
      {(immersionApplication) => {
        if (!immersionApplication) {
          return <p>"Chargement en cours"</p>;
        }

        const currentStatus = immersionApplication.status;

        const buttonProps = {
          disabled,
          immersionApplication,
          jwt,
          onSuccess: setSuccessMessage,
          onError: setErrorMessage,
        };
        const { status } = immersionApplication;

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <FormAccordion immersionApplication={immersionApplication} />
            <div>
              {isAllowedTransition(status, "REJECTED", role) && (
                <VerificationActionButton
                  {...buttonProps}
                  newStatus="REJECTED"
                  messageToShowOnSuccess="Succès. La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise."
                >
                  Refuser l'immersion ...
                </VerificationActionButton>
              )}

              {isAllowedTransition(status, "DRAFT", role) && (
                <VerificationActionButton
                  {...buttonProps}
                  newStatus="DRAFT"
                  messageToShowOnSuccess={
                    "Succès. Cette demande de modification va être communiquée par mail au bénéficiaire et à l'entreprise"
                  }
                >
                  Renvoyer au bénéficiaire pour modification
                </VerificationActionButton>
              )}
              {isAllowedTransition(status, "ACCEPTED_BY_COUNSELLOR", role) && (
                <VerificationActionButton
                  {...buttonProps}
                  newStatus="ACCEPTED_BY_COUNSELLOR"
                  messageToShowOnSuccess={
                    "Succès. L'éligibilité de cette demande est bien enregistrée. Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la convention."
                  }
                  disabled={!!successMessage || currentStatus != "IN_REVIEW"}
                >
                  {currentStatus === "ACCEPTED_BY_COUNSELLOR"
                    ? "Demande déjà validée."
                    : "Marquer la demande comme éligible"}
                </VerificationActionButton>
              )}
              {isAllowedTransition(status, "ACCEPTED_BY_VALIDATOR", role) && (
                <VerificationActionButton
                  {...buttonProps}
                  newStatus="ACCEPTED_BY_VALIDATOR"
                  messageToShowOnSuccess={
                    "Succès. La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail au bénéficiaire et à l'entreprise."
                  }
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
              {isAllowedTransition(status, "VALIDATED", role) && (
                <VerificationActionButton
                  {...buttonProps}
                  newStatus="VALIDATED"
                  messageToShowOnSuccess={
                    "Succès. La confirmation de cette validation est bien envoyée par mail au bénéficiaire et à l'entreprise."
                  }
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
                <ErrorMessage title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. Veuillez réessayer ultérieurement">
                  {errorMessage}
                </ErrorMessage>
              )}

              {successMessage && (
                <SuccessMessage title="Succès">{successMessage}</SuccessMessage>
              )}
            </div>
          </div>
        );
      }}
    </ApiDataContainer>
  );
};
