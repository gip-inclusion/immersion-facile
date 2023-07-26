import React from "react";
import { useDispatch } from "react-redux";
import {
  ConventionJwt,
  ConventionReadDto,
  ConventionStatus,
  Role,
  statusTransitionConfigs,
  UpdateConventionStatusRequestDto,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { VerificationActionButton } from "src/app/components/forms/convention/VerificationActionButton";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  ConventionFeedbackKind,
  conventionSlice,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";

type ConventionManageActionsProps = {
  jwt: ConventionJwt;
  convention: ConventionReadDto;
  role: Role;
  submitFeedback: ConventionSubmitFeedback;
};

export const ConventionManageActions = ({
  convention,
  role,
  submitFeedback,
  jwt,
}: ConventionManageActionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const createOnSubmitWithFeedbackKind =
    (feedbackKind: ConventionFeedbackKind) =>
    (updateStatusParams: UpdateConventionStatusRequestDto) =>
      dispatch(
        conventionSlice.actions.statusChangeRequested({
          conventionId: convention.id,
          jwt,
          feedbackKind,
          updateStatusParams,
        }),
      );
  const disabled = submitFeedback.kind !== "idle";
  const t = useConventionTexts(convention?.internshipKind ?? "immersion");
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--background-raised-grey)",
        padding: ".3rem",
        display: "flex",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      {isAllowedTransition(convention.status, "REJECTED", role) && (
        <VerificationActionButton
          disabled={disabled}
          newStatus="REJECTED"
          onSubmit={createOnSubmitWithFeedbackKind("rejected")}
        >
          {t.verification.rejectConvention}
        </VerificationActionButton>
      )}

      {isAllowedTransition(convention.status, "DEPRECATED", role) && (
        <VerificationActionButton
          disabled={disabled}
          newStatus="DEPRECATED"
          onSubmit={createOnSubmitWithFeedbackKind("deprecated")}
        >
          {t.verification.markAsDeprecated}
        </VerificationActionButton>
      )}

      {isAllowedTransition(convention.status, "DRAFT", role) && (
        <VerificationActionButton
          disabled={disabled}
          newStatus="DRAFT"
          onSubmit={createOnSubmitWithFeedbackKind(
            "modificationAskedFromCounsellorOrValidator",
          )}
        >
          {t.verification.modifyConvention}
        </VerificationActionButton>
      )}

      {isAllowedTransition(
        convention.status,
        "ACCEPTED_BY_COUNSELLOR",
        role,
      ) && (
        <VerificationActionButton
          newStatus="ACCEPTED_BY_COUNSELLOR"
          onSubmit={createOnSubmitWithFeedbackKind("markedAsEligible")}
          disabled={disabled || convention.status != "IN_REVIEW"}
        >
          {convention.status === "ACCEPTED_BY_COUNSELLOR"
            ? t.verification.conventionAlreadyMarkedAsEligible
            : t.verification.markAsEligible}
        </VerificationActionButton>
      )}

      {isAllowedTransition(
        convention.status,
        "ACCEPTED_BY_VALIDATOR",
        role,
      ) && (
        <VerificationActionButton
          newStatus="ACCEPTED_BY_VALIDATOR"
          onSubmit={createOnSubmitWithFeedbackKind("markedAsValidated")}
          disabled={
            disabled ||
            (convention.status != "IN_REVIEW" &&
              convention.status != "ACCEPTED_BY_COUNSELLOR")
          }
        >
          {convention.status === "ACCEPTED_BY_VALIDATOR"
            ? t.verification.conventionAlreadyValidated
            : t.verification.markAsValidated}
        </VerificationActionButton>
      )}

      {isAllowedTransition(convention.status, "CANCELLED", role) && (
        <VerificationActionButton
          newStatus="CANCELLED"
          onSubmit={createOnSubmitWithFeedbackKind("cancelled")}
          disabled={disabled || convention.status != "ACCEPTED_BY_VALIDATOR"}
        >
          {convention.status === "CANCELLED"
            ? t.verification.conventionAlreadyCancelled
            : t.verification.markAsCancelled}
        </VerificationActionButton>
      )}

      <ConventionFeedbackNotification
        submitFeedback={submitFeedback}
        signatories={convention.signatories}
      />
    </div>
  );
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
