import React from "react";
import { MainWrapper, Notification } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  ConventionMagicLinkPayload,
  ConventionStatus,
  Role,
  statusTransitionConfigs,
  UpdateConventionStatusRequestDto,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConventionTexts } from "src/app/contents/convention/textSetup";
import { routes } from "src/app/routes/routes";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import {
  ConventionFeedbackKind,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
import { useConvention } from "src/hooks/convention.hooks";
import { ConventionValidation } from "src/app/components/admin/ConventionValidation";
import { Route } from "type-route";
import { VerificationActionButton } from "src/app/components/forms/convention/VerificationActionButton";

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
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention(jwt);
  const t = useConventionTexts(convention?.internshipKind ?? "immersion");

  const dispatch = useDispatch();

  if (fetchConventionError)
    return (
      <Notification
        title="Erreur lors de la récupération de la convention"
        type="error"
      >
        {fetchConventionError}
      </Notification>
    );

  if (isLoading) return <p>Chargement en cours...</p>;
  if (!convention) return <p>Pas de conventions correspondante trouvée</p>;

  const disabled = submitFeedback.kind !== "idle";
  const currentStatus = convention.status;

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

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionValidation convention={convention} />
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(255,255,255,.7)",
            padding: ".3rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {isAllowedTransition(currentStatus, "REJECTED", role) && (
            <VerificationActionButton
              disabled={disabled}
              newStatus="REJECTED"
              onSubmit={createOnSubmitWithFeedbackKind("rejected")}
            >
              {t.verification.rejectConvention}
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
              {t.verification.modifyConvention}
            </VerificationActionButton>
          )}

          {isAllowedTransition(
            currentStatus,
            "ACCEPTED_BY_COUNSELLOR",
            role,
          ) && (
            <VerificationActionButton
              newStatus="ACCEPTED_BY_COUNSELLOR"
              onSubmit={createOnSubmitWithFeedbackKind("markedAsEligible")}
              disabled={disabled || currentStatus != "IN_REVIEW"}
            >
              {currentStatus === "ACCEPTED_BY_COUNSELLOR"
                ? t.verification.conventionAlreadyMarkedAsEligible
                : t.verification.markAsEligible}
            </VerificationActionButton>
          )}

          {isAllowedTransition(
            currentStatus,
            "ACCEPTED_BY_VALIDATOR",
            role,
          ) && (
            <VerificationActionButton
              newStatus="ACCEPTED_BY_VALIDATOR"
              onSubmit={createOnSubmitWithFeedbackKind("markedAsValidated")}
              disabled={
                disabled ||
                (currentStatus != "IN_REVIEW" &&
                  currentStatus != "ACCEPTED_BY_COUNSELLOR")
              }
            >
              {currentStatus === "ACCEPTED_BY_VALIDATOR"
                ? t.verification.conventionAlreadyValidated
                : t.verification.markAsValidated}
            </VerificationActionButton>
          )}

          <ConventionFeedbackNotification
            submitFeedback={submitFeedback}
            signatories={convention.signatories}
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
