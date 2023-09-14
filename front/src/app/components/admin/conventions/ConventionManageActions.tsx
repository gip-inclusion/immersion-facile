import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays, addDays } from "date-fns";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";
import {
  ConventionDto,
  ConventionReadDto,
  ConventionStatus,
  ConventionSupportedJwt,
  DateIntervalDto,
  domElementIds,
  emptySchedule,
  isConventionRenewed,
  RenewConventionParams,
  renewConventionParamsSchema,
  Role,
  statusTransitionConfigs,
  UpdateConventionStatusRequestDto,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { VerificationActionButton } from "src/app/components/forms/convention/VerificationActionButton";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  ConventionFeedbackKind,
  conventionSlice,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";
import { ImmersionHourLocationSection } from "../../forms/convention/sections/hour-location/ImmersionHourLocationSection";

type ConventionManageActionsProps = {
  jwt: ConventionSupportedJwt;
  convention: ConventionReadDto;
  role: Role;
  submitFeedback: ConventionSubmitFeedback;
};

const renewModal = createModal({
  id: domElementIds.manageConvention.renewModal,
  isOpenedByDefault: false,
});

export const ConventionManageActions = ({
  convention,
  role,
  submitFeedback,
  jwt,
}: ConventionManageActionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const feedback = useAppSelector(conventionSelectors.feedback);
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
        {isAllowedTransition(convention, "REJECTED", role) && (
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

        {isAllowedTransition(convention, "DEPRECATED", role) && (
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

        {isAllowedTransition(convention, "DRAFT", role) && (
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

        {isAllowedTransition(convention, "ACCEPTED_BY_COUNSELLOR", role) && (
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

        {isAllowedTransition(convention, "ACCEPTED_BY_VALIDATOR", role) && (
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

        {isAllowedTransition(convention, "CANCELLED", role) && (
          <>
            <VerificationActionButton
              initialStatus={convention.status}
              newStatus="CANCELLED"
              convention={convention}
              onSubmit={createOnSubmitWithFeedbackKind("cancelled")}
              disabled={
                disabled || convention.status != "ACCEPTED_BY_VALIDATOR"
              }
              currentSignatoryRole={role}
            >
              {convention.status === "CANCELLED"
                ? t.verification.conventionAlreadyCancelled
                : t.verification.markAsCancelled}
            </VerificationActionButton>
            <Button
              iconId="fr-icon-file-add-line"
              className={fr.cx("fr-m-1w")}
              priority="secondary"
              disabled={feedback.kind === "renewed"}
              onClick={() => renewModal.open()}
            >
              Renouveler la convention
            </Button>
            <Button
              iconId="fr-icon-file-pdf-line"
              className={fr.cx("fr-m-1w")}
              priority="secondary"
              onClick={() =>
                routes
                  .conventionDocument({
                    jwt,
                  })
                  .push()
              }
            >
              Voir la convention
            </Button>
          </>
        )}
        {feedback.kind !== "renewed" &&
          createPortal(
            <renewModal.Component title="Renouvellement de convention">
              <RenewConventionForm convention={convention} />
            </renewModal.Component>,
            document.body,
          )}
      </div>
    </div>
  );
};

type RenewConventionParamsInForm = RenewConventionParams &
  Pick<ConventionReadDto, "internshipKind" | "signatories">;

export const RenewConventionForm = ({
  convention,
}: {
  convention: ConventionReadDto;
}) => {
  const route = useRoute() as Route<typeof routes.manageConvention>;
  const dispatch = useDispatch();
  const renewedDefaultDateStart = addBusinessDays(
    new Date(convention.dateEnd),
    1,
  );
  const defaultDateInterval: DateIntervalDto = {
    start: renewedDefaultDateStart,
    end: addDays(new Date(convention.dateEnd), convention.schedule.workedDays),
  };
  const defaultValues = {
    id: uuidV4(),
    dateStart: defaultDateInterval.start.toISOString(),
    dateEnd: defaultDateInterval.end.toISOString(),
    schedule: emptySchedule(defaultDateInterval),
    internshipKind: convention.internshipKind,
    renewed: {
      from: convention.id,
      justification: "",
    },
    signatories: convention.signatories,
  };
  const methods = useForm<RenewConventionParamsInForm>({
    defaultValues,
    resolver: zodResolver(renewConventionParamsSchema),
    mode: "onTouched",
  });
  const getFormErrors = makeFieldError(methods.formState);
  const onSubmit = (data: RenewConventionParams) => {
    dispatch(
      conventionSlice.actions.renewConventionRequested({
        params: data,
        jwt: route.params.jwt,
      }),
    );
    renewModal.close();
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Input
          label="Id de la convention renouvelée"
          hintText={
            "Il n'est pas modificable, mais vous pouvez le copier pour le garder de côté"
          }
          nativeInputProps={{
            ...methods.register("id"),
            readOnly: true,
            value: defaultValues.id,
          }}
        />
        <ImmersionHourLocationSection />
        <Input
          label="Motif de renouvellement"
          textArea
          nativeTextAreaProps={methods.register("renewed.justification")}
          {...getFormErrors("renewed.justification")}
        />
        <Button>Renouveler la convention</Button>
      </form>
    </FormProvider>
  );
};

const isAllowedTransition = (
  convention: ConventionDto,
  targetStatus: ConventionStatus,
  actingRole: Role,
): boolean => {
  const transitionConfig = statusTransitionConfigs[targetStatus];
  if (isConventionRenewed(convention) && targetStatus === "DRAFT") return false;
  return (
    transitionConfig.validInitialStatuses.includes(convention.status) &&
    transitionConfig.validRoles.includes(actingRole)
  );
};
