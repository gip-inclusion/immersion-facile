import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import {
  ConventionReadDto,
  ConventionStatus,
  ConventionSupportedJwt,
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
  jwt: ConventionSupportedJwt;
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
  const [validatorWarningMessage, setValidatorWarningMessage] = useState<
    string | null
  >(null);
  const createOnSubmitWithFeedbackKind =
    (feedbackKind: ConventionFeedbackKind) =>
    (updateStatusParams: UpdateConventionStatusRequestDto) =>
      dispatch(
        conventionSlice.actions.statusChangeRequested({
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
        zIndex: 10,
      }}
    >
      {validatorWarningMessage && (
        <Alert
          closable
          onClose={() => setValidatorWarningMessage(null)}
          description={validatorWarningMessage}
          severity="warning"
          title="Attention !"
        />
      )}
      <ConventionFeedbackNotification
        submitFeedback={submitFeedback}
        signatories={convention.signatories}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {isAllowedTransition(convention.status, "REJECTED", role) && (
          <VerificationActionButton
            disabled={disabled}
            initialStatus={convention.status}
            newStatus="REJECTED"
            convention={convention}
            onSubmit={createOnSubmitWithFeedbackKind("rejected")}
            currentSignatoryRole={role}
          >
            {t.verification.rejectConvention}
          </VerificationActionButton>
        )}

        {isAllowedTransition(convention.status, "DEPRECATED", role) && (
          <VerificationActionButton
            disabled={disabled}
            initialStatus={convention.status}
            newStatus="DEPRECATED"
            onSubmit={createOnSubmitWithFeedbackKind("deprecated")}
            convention={convention}
            currentSignatoryRole={role}
          >
            {t.verification.markAsDeprecated}
          </VerificationActionButton>
        )}

        {isAllowedTransition(convention.status, "DRAFT", role) && (
          <VerificationActionButton
            disabled={disabled}
            initialStatus={convention.status}
            newStatus="DRAFT"
            onSubmit={createOnSubmitWithFeedbackKind(
              "modificationAskedFromCounsellorOrValidator",
            )}
            convention={convention}
            currentSignatoryRole={role}
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
            initialStatus={convention.status}
            newStatus="ACCEPTED_BY_COUNSELLOR"
            convention={convention}
            onSubmit={createOnSubmitWithFeedbackKind("markedAsEligible")}
            disabled={disabled || convention.status != "IN_REVIEW"}
            currentSignatoryRole={role}
            onCloseValidatorModalWithoutValidatorInfo={
              setValidatorWarningMessage
            }
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
            initialStatus={convention.status}
            newStatus="ACCEPTED_BY_VALIDATOR"
            convention={convention}
            onSubmit={createOnSubmitWithFeedbackKind("markedAsValidated")}
            disabled={
              disabled ||
              (convention.status != "IN_REVIEW" &&
                convention.status != "ACCEPTED_BY_COUNSELLOR")
            }
            currentSignatoryRole={role}
            onCloseValidatorModalWithoutValidatorInfo={
              setValidatorWarningMessage
            }
          >
            {convention.status === "ACCEPTED_BY_VALIDATOR"
              ? t.verification.conventionAlreadyValidated
              : t.verification.markAsValidated}
          </VerificationActionButton>
        )}

        {isAllowedTransition(convention.status, "CANCELLED", role) && (
          <VerificationActionButton
            initialStatus={convention.status}
            newStatus="CANCELLED"
            convention={convention}
            onSubmit={createOnSubmitWithFeedbackKind("cancelled")}
            disabled={disabled || convention.status != "ACCEPTED_BY_VALIDATOR"}
            currentSignatoryRole={role}
          >
            {convention.status === "CANCELLED"
              ? t.verification.conventionAlreadyCancelled
              : t.verification.markAsCancelled}
          </VerificationActionButton>
        )}
      </div>
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
