import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays, addDays } from "date-fns";
import React, { useState } from "react";
import { ErrorNotifications } from "react-design-system";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  BackOfficeJwt,
  ConventionJwt,
  ConventionReadDto,
  ConventionStatus,
  ConventionSupportedJwt,
  DateIntervalDto,
  InclusionConnectJwt,
  RenewConventionParams,
  Role,
  UpdateConventionStatusRequestDto,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  isAllowedRole,
  isConventionRenewed,
  isConventionValidated,
  reasonableSchedule,
  renewConventionParamsSchema,
  statusTransitionConfigs,
  toDotNotation,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { VerificationActionButton } from "src/app/components/forms/convention/VerificationActionButton";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  formErrorsToFlatErrors,
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  ConventionFeedbackKind,
  ConventionSubmitFeedback,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { v4 as uuidV4 } from "uuid";
import { ScheduleSection } from "../../forms/convention/sections/schedule/ScheduleSection";

export type JwtKindProps =
  | {
      jwt: BackOfficeJwt;
      kind: "backoffice";
    }
  | {
      jwt: ConventionJwt;
      kind: "convention";
    }
  | {
      jwt: InclusionConnectJwt;
      kind: "inclusionConnect";
    };

type ConventionManageActionsProps = {
  jwtParams: JwtKindProps;
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
  jwtParams,
}: ConventionManageActionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const icUserRole = useAppSelector(
    inclusionConnectedSelectors.userRoleForFetchedConvention,
  );
  const feedback = useAppSelector(conventionSelectors.feedback);
  const [validatorWarningMessage, setValidatorWarningMessage] = useState<
    string | null
  >(null);
  const createOnSubmitWithFeedbackKind =
    (feedbackKind: ConventionFeedbackKind) =>
    (updateStatusParams: UpdateConventionStatusRequestDto) =>
      dispatch(
        conventionSlice.actions.statusChangeRequested({
          jwt: jwtParams.jwt,
          feedbackKind,
          updateStatusParams,
        }),
      );

  const disabled = submitFeedback.kind !== "idle";
  const t = useConventionTexts(convention?.internshipKind ?? "immersion");
  const allowedToSignStatuses: ConventionStatus[] = [
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];
  const shouldShowSignatureAction =
    icUserRole === "establishment-representative" &&
    !convention.signatories.establishmentRepresentative.signedAt &&
    jwtParams.kind !== "backoffice" &&
    allowedToSignStatuses.includes(convention.status);

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
            modalTitle={t.verification.rejectConvention}
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
            modalTitle={t.verification.markAsDeprecated}
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
            modalTitle={t.verification.modifyConventionTitle}
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
            disabled={disabled || convention.status !== "IN_REVIEW"}
            currentSignatoryRole={role}
            onCloseValidatorModalWithoutValidatorInfo={
              setValidatorWarningMessage
            }
            modalTitle={
              convention.status === "ACCEPTED_BY_COUNSELLOR"
                ? t.verification.conventionAlreadyMarkedAsEligible
                : t.verification.markAsEligible
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
              (convention.status !== "IN_REVIEW" &&
                convention.status !== "ACCEPTED_BY_COUNSELLOR")
            }
            currentSignatoryRole={role}
            onCloseValidatorModalWithoutValidatorInfo={
              setValidatorWarningMessage
            }
            modalTitle={
              convention.status === "ACCEPTED_BY_VALIDATOR"
                ? t.verification.conventionAlreadyValidated
                : t.verification.markAsValidated
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
                disabled || convention.status !== "ACCEPTED_BY_VALIDATOR"
              }
              currentSignatoryRole={role}
              modalTitle={
                convention.status === "CANCELLED"
                  ? t.verification.conventionAlreadyCancelled
                  : t.verification.markAsCancelled
              }
            >
              {convention.status === "CANCELLED"
                ? t.verification.conventionAlreadyCancelled
                : t.verification.markAsCancelled}
            </VerificationActionButton>

            <Button
              iconId="fr-icon-file-pdf-line"
              className={fr.cx("fr-m-1w")}
              priority="secondary"
              onClick={() => {
                const payload = decodeMagicLinkJwtWithoutSignatureCheck(
                  jwtParams.jwt,
                );
                const isConventionMagicLinkJwt =
                  "role" in payload && payload.role !== "backOffice";
                return routes
                  .conventionDocument({
                    jwt: isConventionMagicLinkJwt ? jwtParams.jwt : undefined,
                    conventionId: convention.id,
                  })
                  .push();
              }}
              id={domElementIds.manageConvention.openDocumentButton}
            >
              Voir la convention
            </Button>
          </>
        )}
        {isConventionValidated(convention) &&
          !isConventionRenewed(convention) &&
          isAllowedRole(["counsellor", "validator"], role) && (
            <Button
              iconId="fr-icon-file-add-line"
              className={fr.cx("fr-m-1w")}
              priority="secondary"
              disabled={feedback.kind === "renewed"}
              onClick={() => renewModal.open()}
              id={domElementIds.manageConvention.openRenewModalButton}
            >
              Renouveler la convention
            </Button>
          )}
        {shouldShowSignatureAction && (
          <SignButton
            disabled={disabled}
            className={fr.cx("fr-m-1w")}
            onConfirmClick={() => {
              dispatch(
                conventionSlice.actions.signConventionRequested({
                  jwt: jwtParams.jwt,
                  conventionId: convention.id,
                }),
              );
            }}
            signatory={convention.signatories.establishmentRepresentative}
            internshipKind={convention.internshipKind}
            id={domElementIds.manageConvention.openSignModalButton}
            submitButtonId={
              domElementIds.manageConvention.submitSignModalButton
            }
          />
        )}
        {feedback.kind !== "renewed" &&
          createPortal(
            <renewModal.Component title="Renouvellement de convention">
              <RenewConventionForm
                convention={convention}
                jwt={jwtParams.jwt}
              />
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
  jwt,
}: {
  convention: ConventionReadDto;
  jwt: ConventionSupportedJwt;
}) => {
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
    schedule: reasonableSchedule(defaultDateInterval),
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
  const { errors, submitCount } = methods.formState;
  const getFieldError = makeFieldError(methods.formState);

  const conventionValues = methods.getValues();

  const { getFormErrors } = getFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const onSubmit = (data: RenewConventionParams) => {
    dispatch(
      conventionSlice.actions.renewConventionRequested({
        params: data,
        jwt,
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
            defaultValue: defaultValues.id,
          }}
        />
        <ScheduleSection />
        <Input
          label="Motif de renouvellement *"
          textArea
          nativeTextAreaProps={methods.register("renewed.justification")}
          {...getFieldError("renewed.justification")}
        />
        <ErrorNotifications
          labels={getFormErrors()}
          errors={toDotNotation(formErrorsToFlatErrors(errors))}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />
        <Button id={domElementIds.manageConvention.submitRenewModalButton}>
          Renouveler la convention
        </Button>
      </form>
    </FormProvider>
  );
};

const isAllowedTransition = (
  convention: ConventionReadDto,
  targetStatus: ConventionStatus,
  actingRole: Role,
): boolean => {
  const transitionConfig = statusTransitionConfigs[targetStatus];

  return (
    transitionConfig.validInitialStatuses.includes(convention.status) &&
    transitionConfig.validRoles.includes(actingRole) &&
    (!transitionConfig.refine?.(convention).isError ?? true)
  );
};
