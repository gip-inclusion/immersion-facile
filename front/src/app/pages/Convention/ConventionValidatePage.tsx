import React, { useState } from "react";
import { conventionGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ConventionStatus } from "shared/src/convention/convention.dto";
import { statusTransitionConfigs } from "shared/src/convention/conventionStatusTransitions";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import { VerificationActionButton } from "./VerificationActionButton";
import {
  ErrorMessage,
  SuccessMessage,
} from "react-design-system/immersionFacile";

type VerificationPageProps = {
  route: Route<typeof routes.conventionToValidate>;
};

const isAllowedTransition = (
  initialStatus: ConventionStatus,
  targetStatus: ConventionStatus,
  actingRole: Role,
) => {
  const transitionConfig = statusTransitionConfigs[targetStatus];

  return (
    transitionConfig.validInitialStatuses.includes(initialStatus) &&
    transitionConfig.validRoles.includes(actingRole)
  );
};

export const ConventionValidatePage = ({ route }: VerificationPageProps) => {
  const jwt = route.params.jwt;
  const { role } = decodeJwt<ConventionMagicLinkPayload>(jwt);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const disabled = !!successMessage;

  return (
    <ApiDataContainer
      callApi={() => conventionGateway.getMagicLink(jwt)}
      jwt={jwt}
    >
      {(convention) => {
        if (!convention) {
          return <p>"Chargement en cours"</p>;
        }

        const currentStatus = convention.status;

        const buttonProps = {
          disabled,
          convention,
          jwt,
          onSuccess: setSuccessMessage,
          onError: setErrorMessage,
        };
        const { status } = convention;

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <FormAccordion convention={convention} />
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
                    "Succès. L'éligibilité de cette demande est bien enregistrée. Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la Convention."
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
                    : "Envoyer la Convention"}
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
