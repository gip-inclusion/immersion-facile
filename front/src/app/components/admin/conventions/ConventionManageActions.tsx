import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { intersection } from "ramda";
import { useState } from "react";
import { ButtonWithSubMenu } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConnectedUserJwt,
  type ConventionJwt,
  type ConventionReadDto,
  type ConventionStatus,
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
  userHasEnoughRightsOnConvention,
} from "shared";
import { BroadcastAgainButton } from "src/app/components/admin/conventions/BroadcastAgainButton";
import { Feedback } from "src/app/components/feedback/Feedback";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { ModalWrapper } from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { getVerificationActionProps } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  useFeedbackTopic,
  useFeedbackTopics,
} from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { isAllowedConventionTransition } from "src/app/utils/IsAllowedConventionTransition";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";

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
};

export const ConventionManageActions = ({
  convention,
  roles,
  jwtParams,
}: ConventionManageActionsProps): JSX.Element => {
  const dispatch = useDispatch();
  const icUserRoles = useAppSelector(
    inclusionConnectedSelectors.userRolesForFetchedConvention,
  );
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const renewFeedback = useFeedbackTopic("convention-action-renew");
  const conventionActionsFeedback = useFeedbackTopics([
    "convention-action-accept-by-counsellor",
    "convention-action-accept-by-validator",
    "convention-action-reject",
    "convention-action-deprecate",
    "convention-action-cancel",
    "convention-action-edit",
    "convention-action-renew",
  ]);
  const [validatorWarningMessage, setValidatorWarningMessage] = useState<
    string | null
  >(null);

  const createOnSubmitWithFeedbackKind = (
    params:
      | UpdateConventionStatusRequestDto
      | TransferConventionToAgencyRequestDto
      | RenewConventionParams,
  ) => {
    if ("agencyId" in params) {
      dispatch(
        conventionActionSlice.actions.transferConventionToAgencyRequested({
          transferConventionToAgencyParams: {
            agencyId: params.agencyId,
            conventionId: params.conventionId,
            justification: params.justification,
          },
          jwt: jwtParams.jwt,
          feedbackTopic: "transfer-convention-to-agency",
        }),
      );
    }
    if ("schedule" in params) {
      dispatch(
        conventionActionSlice.actions.renewConventionRequested({
          params,
          jwt: jwtParams.jwt,
          feedbackTopic: "convention-action-renew",
        }),
      );
    }
    if ("status" in params) {
      if (params.status === "ACCEPTED_BY_COUNSELLOR") {
        dispatch(
          conventionActionSlice.actions.acceptByCounsellorRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-accept-by-counsellor",
            updateStatusParams: params,
          }),
        );
      }
      if (params.status === "ACCEPTED_BY_VALIDATOR") {
        dispatch(
          conventionActionSlice.actions.acceptByValidatorRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-accept-by-validator",
            updateStatusParams: params,
          }),
        );
      }
      if (params.status === "REJECTED") {
        dispatch(
          conventionActionSlice.actions.rejectConventionRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-reject",
            updateStatusParams: params,
          }),
        );
      }
      if (params.status === "DEPRECATED") {
        dispatch(
          conventionActionSlice.actions.deprecateConventionRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-deprecate",
            updateStatusParams: params,
          }),
        );
      }
      if (params.status === "CANCELLED") {
        dispatch(
          conventionActionSlice.actions.cancelConventionRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-cancel",
            updateStatusParams: params,
          }),
        );
      }
      if (params.status === "DRAFT") {
        dispatch(
          conventionActionSlice.actions.editConventionRequested({
            jwt: jwtParams.jwt,
            feedbackTopic: "convention-action-edit",
            updateStatusParams: params,
          }),
        );
      }
    }
  };

  const disabled = !!conventionActionsFeedback.length;
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
          {
            ...getVerificationActionProps({
              initialStatus: convention.status,
              children: t.verification.modifyConventionAgency,
              modalTitle: t.verification.modifyConventionAgencyTitle,
              verificationAction: "TRANSFER",
              convention,
              disabled,
              currentSignatoryRoles: requesterRoles,
              onSubmit: createOnSubmitWithFeedbackKind,
            }).buttonProps,

            id: domElementIds.manageConvention.transferToAgencyButton,
          },
        ]
      : []),
    {
      ...getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.modifyConventionOtherInformations,
        modalTitle: t.verification.modifyConvention,
        verificationAction: "REQUEST_EDIT",
        convention,
        disabled,
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
      }).buttonProps,
      id: domElementIds.manageConvention.requestEditButton,
    },
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

      <Feedback
        topics={[
          "transfer-convention-to-agency",
          "convention-action-accept-by-counsellor",
          "convention-action-accept-by-validator",
          "convention-action-reject",
          "convention-action-deprecate",
          "convention-action-cancel",
          "convention-action-edit",
          "convention-action-renew",
        ]}
        className="fr-mb-2w"
        closable
      />

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
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.rejectConvention,
                modalTitle: t.verification.rejectConvention,
                verificationAction: "REJECT",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
              }).buttonProps}
              iconId="fr-icon-close-circle-line"
              id={
                domElementIds.manageConvention.conventionValidationRejectButton
              }
            />
            <ModalWrapper
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.rejectConvention,
                modalTitle: t.verification.rejectConvention,
                verificationAction: "REJECT",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(convention, "DEPRECATED", roles) && (
          <>
            <Button
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.markAsDeprecated,
                modalTitle: t.verification.markAsDeprecated,
                verificationAction: "DEPRECATE",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
              }).buttonProps}
              iconId="fr-icon-checkbox-circle-line"
              id={
                domElementIds.manageConvention
                  .conventionValidationDeprecateButton
              }
            />
            <ModalWrapper
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.markAsDeprecated,
                modalTitle: t.verification.markAsDeprecated,
                verificationAction: "DEPRECATE",
                convention,
                disabled,
                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
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
                  id={domElementIds.manageConvention.editActionsButton}
                />
                <ModalWrapper
                  {...getVerificationActionProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionOtherInformations,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind,
                  }).modalWrapperProps}
                />

                <ModalWrapper
                  {...getVerificationActionProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionAgency,
                    modalTitle: t.verification.modifyConventionAgencyTitle,
                    verificationAction: "TRANSFER",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind,
                  }).modalWrapperProps}
                />
              </>
            )}
            {navItems.length === 1 && (
              <>
                <Button
                  {...getVerificationActionProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConvention,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind,
                  }).buttonProps}
                  iconId="fr-icon-edit-line"
                  id={domElementIds.manageConvention.requestEditButton}
                />

                <ModalWrapper
                  {...getVerificationActionProps({
                    initialStatus: convention.status,
                    children: t.verification.modifyConventionOtherInformations,
                    modalTitle: t.verification.modifyConvention,
                    verificationAction: "REQUEST_EDIT",
                    convention,
                    disabled,
                    currentSignatoryRoles: requesterRoles,
                    onSubmit: createOnSubmitWithFeedbackKind,
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
              {...getVerificationActionProps({
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
                onSubmit: createOnSubmitWithFeedbackKind,
              }).buttonProps}
              iconId="fr-icon-checkbox-circle-line"
              id={
                domElementIds.manageConvention
                  .conventionValidationValidateButton
              }
            />
            <ModalWrapper
              {...getVerificationActionProps({
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
                onSubmit: createOnSubmitWithFeedbackKind,
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
              {...getVerificationActionProps({
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
                onSubmit: createOnSubmitWithFeedbackKind,
                onCloseValidatorModalWithoutValidatorInfo:
                  setValidatorWarningMessage,
                disabled:
                  disabled ||
                  (convention.status !== "IN_REVIEW" &&
                    convention.status !== "ACCEPTED_BY_COUNSELLOR"),
              }).buttonProps}
              iconId="fr-icon-checkbox-circle-line"
              id={
                domElementIds.manageConvention
                  .conventionValidationValidateButton
              }
            />
            <ModalWrapper
              {...getVerificationActionProps({
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
                onSubmit: createOnSubmitWithFeedbackKind,
              }).modalWrapperProps}
            />
          </>
        )}

        {isAllowedConventionTransition(convention, "CANCELLED", roles) && (
          <>
            <Button
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.markAsCancelled,
                modalTitle: t.verification.markAsCancelled,
                verificationAction: "CANCEL",
                convention,
                disabled:
                  disabled || convention.status !== "ACCEPTED_BY_VALIDATOR",

                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
              }).buttonProps}
              iconId="fr-icon-close-circle-line"
              id={
                domElementIds.manageConvention.conventionValidationCancelButton
              }
            />
            <ModalWrapper
              {...getVerificationActionProps({
                initialStatus: convention.status,
                children: t.verification.markAsCancelled,
                modalTitle: t.verification.markAsCancelled,
                verificationAction: "CANCEL",
                convention,
                disabled:
                  disabled || convention.status !== "ACCEPTED_BY_VALIDATOR",

                currentSignatoryRoles: requesterRoles,
                onSubmit: createOnSubmitWithFeedbackKind,
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
            <>
              <Button
                {...getVerificationActionProps({
                  initialStatus: convention.status,
                  children: "Renouveler la convention",
                  modalTitle: "Renouvellement de convention",
                  verificationAction: "RENEW",
                  convention,
                  disabled: renewFeedback?.level === "success",
                  currentSignatoryRoles: requesterRoles,
                  onSubmit: createOnSubmitWithFeedbackKind,
                }).buttonProps}
                iconId="fr-icon-file-add-line"
                id={domElementIds.manageConvention.openRenewModalButton}
              />
              <ModalWrapper
                {...getVerificationActionProps({
                  initialStatus: convention.status,
                  children: "Renouveler la convention",
                  modalTitle: "Renouvellement de convention",
                  verificationAction: "RENEW",
                  convention,
                  disabled: renewFeedback?.level === "success",
                  currentSignatoryRoles: requesterRoles,
                  onSubmit: createOnSubmitWithFeedbackKind,
                }).modalWrapperProps}
              />
            </>
          )}
        {shouldShowSignatureAction && (
          <SignButton
            disabled={disabled}
            className={fr.cx("fr-m-1w")}
            onConfirmClick={() => {
              dispatch(
                conventionActionSlice.actions.signConventionRequested({
                  jwt: jwtParams.jwt,
                  conventionId: convention.id,
                  feedbackTopic: "convention-action-sign",
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

        {currentUser &&
          userHasEnoughRightsOnConvention(currentUser, convention, [
            "counsellor",
            "validator",
          ]) && <BroadcastAgainButton conventionId={convention.id} />}
      </div>
    </div>
  );
};
