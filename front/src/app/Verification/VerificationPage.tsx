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

export const successMessageByStatus = {
  REJECTED:
    "Succès. La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise.",
  ACCEPTED_BY_COUNSELLOR:
    "Succès. L'éligibilité de cette demande est bien enregistrée. Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la convention.",
  ACCEPTED_BY_VALIDATOR:
    "Succès. La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail au bénéficiaire et à l'entreprise.",
  VALIDATED:
    "Succès. La confirmation de cette validation est bien envoyée par mail au bénéficiaire et à l'entreprise.",
  UNKNOWN:
    "Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement",
  DRAFT:
    "Succès. Cette demande de modification va être communiquée par mail au bénéficiaire et à l'entreprise",
  READY_TO_SIGN:
    "Attention! Cette demande d'immersion est à statut 'Prête à ëtre Signée', donc vous ne devriez pas encore pouvoir la visualiser. Veuillez consulter l'équipe Immérsion Facilitée",
  PARTIALLY_SIGNED:
    "Attention! Cette demande d'immersion est à statut 'Signée Partiellement', donc vous ne devriez pas encore pouvoir la visualiser. Veuillez consulter l'équipe Immérsion Facilitée",
  IN_REVIEW:
    "Attention! Cette demande d'immersion est à statut 'En cours de revue', l'opération que vous venez d'effectuer ne semble pas avoir été appliquée. Veuillez réésayer ou consulter l'équipe Immérsion Facilitée",
};

export const VerificationPage = ({ route }: VerificationPageProps) => {
  const {
    immersionApplication,
    role,
    applicationId,
    jwt,
    needsMagicLinkRefresh,
  } = useImmersionApplicationFromJwt(route.params.jwt);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const currentStatus =
    immersionApplication?.status ?? ("UNKNOWN" as ApplicationStatus);
  if (!role) return <div>Vous n'êtes pas autorisé à accéder à cette page"</div>;

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
      role +
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
          role,
        ) && (
          <VerificationActionButton
            {...buttonProps}
            newStatus="REJECTED"
            messageToShowOnSuccess="Succès. La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise."
          >
            Refuser l'immersion ...
          </VerificationActionButton>
        )}

        {isAllowedTransition(immersionApplication?.status, "DRAFT", role) && (
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
        {isAllowedTransition(
          immersionApplication?.status,
          "ACCEPTED_BY_COUNSELLOR",
          role,
        ) && (
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
        {isAllowedTransition(
          immersionApplication?.status,
          "ACCEPTED_BY_VALIDATOR",
          role,
        ) && (
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
        {isAllowedTransition(
          immersionApplication?.status,
          "VALIDATED",
          role,
        ) && (
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
};
