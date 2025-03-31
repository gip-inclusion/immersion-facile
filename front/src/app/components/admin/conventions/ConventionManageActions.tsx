import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBusinessDays, addDays } from "date-fns";
import { intersection } from "ramda";
import { useState } from "react";
import { ButtonWithSubMenu, ErrorNotifications } from "react-design-system";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConnectedUserJwt,
  type ConventionJwt,
  type ConventionReadDto,
  type ConventionStatus,
  type ConventionSupportedJwt,
  type DateIntervalDto,
  type ExcludeFromExisting,
  type RenewConventionParams,
  type Role,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  hasAllowedRole,
  isConventionRenewed,
  isConventionValidated,
  reasonableSchedule,
  renewConventionParamsSchema,
  userHasEnoughRightsOnConvention,
} from "shared";
import { BroadcastAgainButton } from "src/app/components/admin/conventions/BroadcastAgainButton";
import { Feedback } from "src/app/components/feedback/Feedback";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import {
  ModalWrapper,
  getVerificationActionButtonProps,
} from "src/app/components/forms/convention/VerificationActionButton";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { isAllowedConventionTransition } from "src/app/utils/IsAllowedConventionTransition";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  type ConventionFeedbackKind,
  type ConventionSubmitFeedback,
  conventionSlice,
} from "src/core-logic/domain/convention/convention.slice";
import { transferConventionToAgencySlice } from "src/core-logic/domain/convention/transfer-convention-to-agency/transferConventionToAgency.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { v4 as uuidV4 } from "uuid";
import { ScheduleSection } from "../../forms/convention/sections/schedule/ScheduleSection";

export type JwtKindProps =
  | {
      jwt: ConnectedUserJwt;
      kind: "backoffice";
    }
  | {
      jwt: ConventionJwt;
      kind: "convention";
    }
  | {
      jwt: ConnectedUserJwt;
      kind: "inclusionConnect";
    };

type ConventionManageActionsProps = {
  jwtParams: JwtKindProps;
  convention: ConventionReadDto;
  roles: Role[];
  submitFeedback: ConventionSubmitFeedback;
};

const renewModal = createModal({
  id: domElementIds.manageConvention.renewModal,
  isOpenedByDefault: false,
});

export const ConventionManageActions = ({
  convention,
  roles,
  submitFeedback,
  jwtParams,
}: ConventionManageActionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const icUserRoles = useAppSelector(
    inclusionConnectedSelectors.userRolesForFetchedConvention,
  );
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const feedback = useAppSelector(conventionSelectors.feedback);
  const [validatorWarningMessage, setValidatorWarningMessage] = useState<
    string | null
  >(null);
  const createOnSubmitWithFeedbackKind =
    (feedbackKind: ConventionFeedbackKind | "transfer-convention-to-agency") =>
    (
      params:
        | UpdateConventionStatusRequestDto
        | TransferConventionToAgencyRequestDto,
    ) => {
      if (
        "agencyId" in params &&
        feedbackKind === "transfer-convention-to-agency"
      ) {
        dispatch(
          transferConventionToAgencySlice.actions.transferConventionToAgencyRequested(
            {
              agencyId: params.agencyId,
              conventionId: params.conventionId,
              justification: params.justification,
              jwt: jwtParams.jwt,
              feedbackTopic: feedbackKind,
            },
          ),
        );
      }
      if (
        "status" in params &&
        feedbackKind !== "transfer-convention-to-agency"
      ) {
        dispatch(
          conventionSlice.actions.statusChangeRequested({
            jwt: jwtParams.jwt,
            feedbackKind,
            updateStatusParams: params,
          }),
        );
      }
    };

  const disabled = submitFeedback.kind !== "idle";
  const t = useConventionTexts(convention?.internshipKind ?? "immersion");
  const allowedToSignStatuses: ConventionStatus[] = [
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];
  const allowedToTransferStatuses: ConventionStatus[] = [
    "IN_REVIEW",
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];
  const shouldShowSignatureAction =
    icUserRoles.includes("establishment-representative") &&
    !convention.signatories.establishmentRepresentative.signedAt &&
    jwtParams.kind !== "backoffice" &&
    allowedToSignStatuses.includes(convention.status);

  const requesterRoles = roles.filter(
    (role): role is ExcludeFromExisting<Role, "agency-admin"> =>
      role !== "agency-admin",
  );

  const shouldShowTransferButton = () => {
    if (
      jwtParams.kind === "backoffice" &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;
    if (
      intersection(roles, [
        "agency-admin",
        "counsellor",
        "validator",
        "back-office",
      ]).length > 0 &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;
    if (
      intersection(icUserRoles, ["agency-admin", "counsellor", "validator"])
        .length > 0 &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;

    if (
      currentUser?.isBackofficeAdmin &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;
    return false;
  };

  const navItems = [
    ...(shouldShowTransferButton()
      ? [
          getVerificationActionButtonProps({
            initialStatus: convention.status,
            children: t.verification.modifyConventionAgency,
            modalTitle: t.verification.modifyConventionAgencyTitle,
            verificationAction: "TRANSFER",
            convention,
            disabled,
            currentSignatoryRoles: requesterRoles,
            onSubmit: createOnSubmitWithFeedbackKind(
              "transfer-convention-to-agency",
            ),
          }).buttonProps,
        ]
      : []),
    getVerificationActionButtonProps({
      initialStatus: convention.status,
      children: t.verification.modifyConventionOtherInformations,
      modalTitle: t.verification.modifyConvention,
      verificationAction: "REQUEST_EDIT",
      convention,
      disabled,
      currentSignatoryRoles: requesterRoles,
      onSubmit: createOnSubmitWithFeedbackKind(
        "modificationAskedFromCounsellorOrValidator",
      ),
    }).buttonProps,
  ];

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
      <Feedback topic="transfer-convention-to-agency" className="fr-mb-2w" />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {isAllowedConventionTransition(convention, "REJECTED", roles) && (
          <>
            <Button
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.rejectConvention,
                modalTitle: t.verification.rejectConvention,
                verificationAction: "REJECT",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("rejected"),
              }).buttonProps}
            />
            <ModalWrapper
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.rejectConvention,
                modalTitle: t.verification.rejectConvention,
                verificationAction: "REJECT",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("rejected"),
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(convention, "DEPRECATED", roles) && (
          <>
            <Button
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.markAsDeprecated,
                modalTitle: t.verification.markAsDeprecated,
                verificationAction: "DEPRECATE",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("deprecated"),
              }).buttonProps}
            />
            <ModalWrapper
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.markAsDeprecated,
                modalTitle: t.verification.markAsDeprecated,
                verificationAction: "DEPRECATE",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("deprecated"),
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(convention, "DRAFT", roles) && (
          <>
            {navItems.length > 1 && (
              <>
                <ButtonWithSubMenu
                  buttonLabel={t.verification.modifyConvention}
                  openedTop={true}
                  navItems={navItems}
                  priority={"secondary"}
                  buttonIconId="fr-icon-arrow-down-s-line"
                  iconPosition="right"
                  id={domElementIds.manageConvention.edit.actionsButton}
                />
                <ModalWrapper
                  {...getVerificationActionButtonProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionOtherInformations,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind(
                      "modificationAskedFromCounsellorOrValidator",
                    ),
                  }).modalWrapperProps}
                />

                <ModalWrapper
                  {...getVerificationActionButtonProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionAgency,
                    modalTitle: t.verification.modifyConventionAgencyTitle,
                    verificationAction: "TRANSFER",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind(
                      "transfer-convention-to-agency",
                    ),
                  }).modalWrapperProps}
                />
              </>
            )}
            {navItems.length === 1 && (
              <>
                <Button
                  {...getVerificationActionButtonProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConvention,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind(
                      "modificationAskedFromCounsellorOrValidator",
                    ),
                  }).buttonProps}
                />

                <ModalWrapper
                  {...getVerificationActionButtonProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionOtherInformations,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind(
                      "modificationAskedFromCounsellorOrValidator",
                    ),
                  }).modalWrapperProps}
                />
              </>
            )}
          </>
        )}

        {isAllowedConventionTransition(
          convention,
          "ACCEPTED_BY_COUNSELLOR",
          roles,
        ) && (
          <>
            <Button
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children:
                  convention.status === "ACCEPTED_BY_COUNSELLOR"
                    ? t.verification.conventionAlreadyMarkedAsEligible
                    : t.verification.markAsEligible,
                modalTitle:
                  convention.status === "ACCEPTED_BY_COUNSELLOR"
                    ? t.verification.conventionAlreadyMarkedAsEligible
                    : t.verification.markAsEligible,
                verificationAction: "ACCEPT_COUNSELLOR",
                disabled: disabled || convention.status !== "IN_REVIEW",
                convention,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("markedAsEligible"),
              }).buttonProps}
            />
            <ModalWrapper
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children:
                  convention.status === "ACCEPTED_BY_COUNSELLOR"
                    ? t.verification.conventionAlreadyMarkedAsEligible
                    : t.verification.markAsEligible,
                modalTitle:
                  convention.status === "ACCEPTED_BY_COUNSELLOR"
                    ? t.verification.conventionAlreadyMarkedAsEligible
                    : t.verification.markAsEligible,
                verificationAction: "ACCEPT_COUNSELLOR",
                disabled: disabled || convention.status !== "IN_REVIEW",
                convention,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("markedAsEligible"),
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(
          convention,
          "ACCEPTED_BY_VALIDATOR",
          roles,
        ) && (
          <>
            <Button
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children:
                  convention.status === "ACCEPTED_BY_VALIDATOR"
                    ? t.verification.conventionAlreadyValidated
                    : t.verification.markAsValidated,
                modalTitle:
                  convention.status === "ACCEPTED_BY_VALIDATOR"
                    ? t.verification.conventionAlreadyValidated
                    : t.verification.markAsValidated,
                verificationAction: "ACCEPT_VALIDATOR",
                convention,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("markedAsValidated"),
                onCloseValidatorModalWithoutValidatorInfo:
                  setValidatorWarningMessage,
                disabled:
                  disabled ||
                  (convention.status !== "IN_REVIEW" &&
                    convention.status !== "ACCEPTED_BY_COUNSELLOR"),
              }).buttonProps}
            />
            <ModalWrapper
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children:
                  convention.status === "ACCEPTED_BY_VALIDATOR"
                    ? t.verification.conventionAlreadyValidated
                    : t.verification.markAsValidated,
                modalTitle:
                  convention.status === "ACCEPTED_BY_VALIDATOR"
                    ? t.verification.conventionAlreadyValidated
                    : t.verification.markAsValidated,
                verificationAction: "ACCEPT_VALIDATOR",
                convention,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("markedAsValidated"),
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(convention, "CANCELLED", roles) && (
          <>
            <Button
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.markAsCancelled,
                modalTitle: t.verification.markAsCancelled,
                verificationAction: "CANCEL",
                convention,
                disabled:
                  disabled || convention.status !== "ACCEPTED_BY_VALIDATOR",

                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("cancelled"),
              }).buttonProps}
            />
            <ModalWrapper
              {...getVerificationActionButtonProps({
                initialStatus: convention.status,
                children: t.verification.markAsCancelled,
                modalTitle: t.verification.markAsCancelled,
                verificationAction: "CANCEL",
                convention,
                disabled:
                  disabled || convention.status !== "ACCEPTED_BY_VALIDATOR",

                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind("cancelled"),
              }).modalWrapperProps}
            />
            <Button
              iconId="fr-icon-file-pdf-line"
              className={fr.cx("fr-m-1w")}
              priority="secondary"
              onClick={() => {
                const payload = decodeMagicLinkJwtWithoutSignatureCheck(
                  jwtParams.jwt,
                );
                const isConventionMagicLinkJwt =
                  "role" in payload && payload.role !== "back-office";
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
          hasAllowedRole({
            allowedRoles: ["counsellor", "validator"],
            candidateRoles: roles,
          }) && (
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

        {currentUser &&
          userHasEnoughRightsOnConvention(currentUser, convention, [
            "counsellor",
            "validator",
          ]) && <BroadcastAgainButton conventionId={convention.id} />}
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
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="im-convention-renew-form"
      >
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
          errorsWithLabels={toErrorsWithLabels({
            labels: getFormErrors(),
            errors: displayReadableError(errors),
          })}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />
        <Button id={domElementIds.manageConvention.submitRenewModalButton}>
          Renouveler la convention
        </Button>
      </form>
    </FormProvider>
  );
};
