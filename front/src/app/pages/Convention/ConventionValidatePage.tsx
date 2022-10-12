import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  ConventionMagicLinkPayload,
  ConventionStatus,
  Role,
  statusTransitionConfigs,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/ConventionFeedbackNotification";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  ConventionFeedbackKind,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
import { ConventionFormAccordion } from "src/uiComponents/admin/ConventionFormAccordion";
import { Route } from "type-route";
import { VerificationActionButton } from "./VerificationActionButton";

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
  const convention = useAppSelector(conventionSelectors.convention);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(conventionSlice.actions.conventionRequested(jwt));
  }, []);

  if (!convention) {
    return <p>"Chargement en cours..."</p>;
  }

  const disabled = submitFeedback.kind !== "idle";
  const currentStatus = convention.status;

  const createOnSubmitWithFeedbackKind =
    (feedbackKind: ConventionFeedbackKind) =>
    (params: { justification?: string; newStatus: ConventionStatus }) =>
      dispatch(
        conventionSlice.actions.statusChangeRequested({
          jwt,
          feedbackKind,
          ...params,
        }),
      );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <ConventionFormAccordion convention={convention} />
      <div>
        {isAllowedTransition(currentStatus, "REJECTED", role) && (
          <VerificationActionButton
            disabled={disabled}
            newStatus="REJECTED"
            onSubmit={createOnSubmitWithFeedbackKind("rejected")}
          >
            Refuser l'immersion ...
          </VerificationActionButton>
        )}

        {isAllowedTransition(currentStatus, "DRAFT", role) && (
          <VerificationActionButton
            disabled={disabled}
            newStatus="DRAFT"
            onSubmit={createOnSubmitWithFeedbackKind(
              "modificationAskedFromCounsellorOrValidator",
            )}
          >
            Renvoyer au bénéficiaire pour modification
          </VerificationActionButton>
        )}

        {isAllowedTransition(currentStatus, "ACCEPTED_BY_COUNSELLOR", role) && (
          <VerificationActionButton
            newStatus="ACCEPTED_BY_COUNSELLOR"
            onSubmit={createOnSubmitWithFeedbackKind("markedAsEligible")}
            disabled={disabled || currentStatus != "IN_REVIEW"}
          >
            {currentStatus === "ACCEPTED_BY_COUNSELLOR"
              ? "Demande déjà validée."
              : "Marquer la demande comme éligible"}
          </VerificationActionButton>
        )}

        {isAllowedTransition(currentStatus, "ACCEPTED_BY_VALIDATOR", role) && (
          <VerificationActionButton
            newStatus="ACCEPTED_BY_VALIDATOR"
            onSubmit={createOnSubmitWithFeedbackKind("markedAsEligible")}
            disabled={
              disabled ||
              (currentStatus != "IN_REVIEW" &&
                currentStatus != "ACCEPTED_BY_COUNSELLOR")
            }
          >
            {currentStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Demande déjà validée"
              : "Valider la demande"}
          </VerificationActionButton>
        )}

        <ConventionFeedbackNotification
          submitFeedback={submitFeedback}
          signatories={convention.signatories}
        />
      </div>
    </div>
  );
};
