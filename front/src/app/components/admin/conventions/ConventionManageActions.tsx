import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { intersection } from "ramda";
import { useEffect, useState } from "react";
import { ButtonWithSubMenu } from "react-design-system";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  allowedRolesToCreateAssessment,
  type ConnectedUser,
  type ConnectedUserJwt,
  type ConventionJwt,
  type ConventionReadDto,
  type ConventionStatus,
  conventionEstablishmentsRoles,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  type EditConventionCounsellorNameRequestDto,
  type ExcludeFromExisting,
  establishmentsRoles,
  hasAllowedRole,
  hasAllowedRoleOnAssessment,
  isConventionRenewed,
  isConventionValidated,
  type MarkPartnersErroredConventionAsHandledRequest,
  markPartnersErroredConventionAsHandledRequestSchema,
  type RenewConventionParams,
  type Role,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  userHasEnoughRightsOnConvention,
} from "shared";
import { BroadcastAgainButton } from "src/app/components/admin/conventions/BroadcastAgainButton";
import { Feedback } from "src/app/components/feedback/Feedback";
import { getVerificationActionProps } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { ModalWrapper } from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  useFeedbackTopic,
  useFeedbackTopics,
} from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionReadToConventionRouteParams } from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
import { isAllowedConventionTransition } from "src/app/utils/IsAllowedConventionTransition";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import {
  canAssessmentBeFilled,
  isConventionEndingInOneDayOrMore,
} from "src/core-logic/domain/convention/convention.utils";
import { conventionActionSelectors } from "src/core-logic/domain/convention/convention-action/conventionAction.selectors";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { partnersErroredConventionSelectors } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.selectors";
import { partnersErroredConventionSlice } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.slice";

export type JwtKindProps =
  | {
      jwt: ConnectedUserJwt;
      kind: "connected user backoffice";
    }
  | {
      jwt: ConventionJwt;
      kind: "convention";
    }
  | {
      jwt: ConnectedUserJwt;
      kind: "connected user";
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
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const broadcastErrorFeedback = useAppSelector(
    partnersErroredConventionSelectors.lastBroadcastFeedback,
  )?.subscriberErrorFeedback;
  const renewFeedback = useFeedbackTopic("convention-action-renew");
  const conventionActionsFeedback = useFeedbackTopics([
    "convention-action-accept-by-counsellor",
    "convention-action-accept-by-validator",
    "convention-action-reject",
    "convention-action-deprecate",
    "convention-action-cancel",
    "convention-action-renew",
  ]);

  const [validatorWarningMessage, setValidatorWarningMessage] = useState<
    string | null
  >(null);

  const createOnSubmitWithFeedbackKind = (
    params:
      | UpdateConventionStatusRequestDto
      | TransferConventionToAgencyRequestDto
      | RenewConventionParams
      | EditConventionCounsellorNameRequestDto,
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
    if (
      "firstname" in params &&
      "lastname" in params &&
      !("status" in params)
    ) {
      dispatch(
        conventionActionSlice.actions.editCounsellorNameRequested({
          editCounsellorNameParams: params,
          jwt: jwtParams.jwt,
          feedbackTopic: "convention-action-edit-counsellor-name",
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
    roles.includes("establishment-representative") &&
    !convention.signatories.establishmentRepresentative.signedAt &&
    jwtParams.kind !== "connected user backoffice" &&
    allowedToSignStatuses.includes(convention.status);

  const shouldShowConventionDocumentButton =
    convention.status === "ACCEPTED_BY_VALIDATOR";
  const shouldShowAssessmentAbandonAction =
    canAssessmentBeFilled(convention) &&
    isConventionEndingInOneDayOrMore(convention);

  const shouldShowAssessmentFullFillAction =
    canAssessmentBeFilled(convention) &&
    !isConventionEndingInOneDayOrMore(convention) &&
    intersection(roles, [
      ...allowedRolesToCreateAssessment,
      ...establishmentsRoles,
      ...conventionEstablishmentsRoles,
    ]).length > 0;

  const shouldShowAssessmentDocumentAction =
    !!convention.assessment &&
    hasAllowedRoleOnAssessment(roles, "GetAssessment", convention);

  const requesterRoles = roles.filter(
    (role): role is ExcludeFromExisting<Role, "agency-admin"> =>
      role !== "agency-admin",
  );

  const shouldShowTransferButton = () => {
    if (
      jwtParams.kind === "connected user backoffice" &&
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
      currentUser?.isBackofficeAdmin &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;
    return false;
  };

  const shouldShowModifyConventionButton = () => {
    if (
      convention.status === "ACCEPTED_BY_COUNSELLOR" &&
      convention.agencyRefersTo &&
      !roles.includes("counsellor")
    )
      return false;
    return isAllowedConventionTransition(convention, "READY_TO_SIGN", roles);
  };

  const modificationItems: (ButtonProps & { id: string })[] = [
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
        children: t.verification.modifyCounsellorName,
        modalTitle: t.verification.modifyCounsellorNameTitle,
        verificationAction: "EDIT_COUNSELLOR_NAME",
        convention,
        disabled,
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
      }).buttonProps,

      id: domElementIds.manageConvention.editCounsellorNameButton,
    },
    {
      id: domElementIds.manageConvention.editLink,
      priority: "secondary",
      children: t.verification.modifyConventionOtherInformations,
      linkProps: routes.conventionImmersion({
        conventionId: convention.id,
        jwt: jwtParams.jwt,
        skipIntro: true,
      }).link,
    },
  ];

  const payload = decodeMagicLinkJwtWithoutSignatureCheck(jwtParams.jwt);
  const isConventionMagicLinkJwt = "role" in payload;

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
          "convention-action-renew",
          "convention-action-edit-counsellor-name",
          "partner-conventions",
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
        {
          <Button
            id={domElementIds.manageConvention.duplicateConventionButton}
            priority="secondary"
            linkProps={
              convention.internshipKind === "immersion"
                ? routes.conventionImmersion({
                    ...conventionReadToConventionRouteParams(convention),
                    skipIntro: true,
                  }).link
                : routes.conventionMiniStage(
                    conventionReadToConventionRouteParams(convention),
                  ).link
            }
          >
            Dupliquer la demande
          </Button>
        }
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

        {isAllowedConventionTransition(convention, "READY_TO_SIGN", roles) &&
          shouldShowModifyConventionButton() && (
            <>
              <ButtonWithSubMenu
                buttonLabel={t.verification.modifyConvention}
                openedTop={true}
                navItems={modificationItems}
                priority={"secondary"}
                buttonIconId="fr-icon-arrow-down-s-line"
                iconPosition="right"
                id={domElementIds.manageConvention.editActionsButton}
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
              <ModalWrapper
                {...getVerificationActionProps({
                  initialStatus: convention.status,
                  children: t.verification.modifyCounsellorName,
                  modalTitle: t.verification.modifyCounsellorNameTitle,
                  verificationAction: "EDIT_COUNSELLOR_NAME",
                  convention,
                  disabled,
                  currentSignatoryRoles: requesterRoles,
                  onSubmit: createOnSubmitWithFeedbackKind,
                }).modalWrapperProps}
              />
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

        {isAllowedConventionTransition(convention, "CANCELLED", roles) &&
          !convention.assessment && (
            <>
              {shouldShowAssessmentAbandonAction &&
              hasAllowedRoleOnAssessment(
                roles,
                "CreateAssessment",
                convention,
              ) ? (
                <ButtonWithSubMenu
                  buttonLabel={t.verification.markAsCancelled}
                  openedTop={true}
                  navItems={[
                    {
                      ...getVerificationActionProps({
                        initialStatus: convention.status,
                        children: t.verification.markAsCancelled,
                        modalTitle: t.verification.markAsCancelled,
                        verificationAction: "CANCEL",
                        convention,
                        disabled:
                          disabled ||
                          convention.status !== "ACCEPTED_BY_VALIDATOR",

                        currentSignatoryRoles: requesterRoles,
                        onSubmit: createOnSubmitWithFeedbackKind,
                      }).buttonProps,
                      id: domElementIds.manageConvention
                        .conventionValidationCancelButton,
                      iconId: "fr-icon-close-circle-line",
                    },
                    {
                      linkProps: {
                        href: routes.assessment({
                          jwt: jwtParams.jwt,
                          conventionId: convention.id,
                        }).href,
                      },
                      children: "Déclarer un abandon",
                      id: domElementIds.manageConvention
                        .abandonAssessmentButton,
                    },
                  ]}
                  priority={"secondary"}
                  buttonIconId="fr-icon-arrow-down-s-line"
                  iconPosition="right"
                  id={
                    domElementIds.manageConvention
                      .conventionValidationCancelActionButtons
                  }
                />
              ) : (
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
                    domElementIds.manageConvention
                      .conventionValidationCancelButton
                  }
                />
              )}

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
            </>
          )}

        {
          <>
            {shouldShowAssessmentDocumentAction && (
              <Button
                id={domElementIds.manageConvention.assessmentDocumentButton}
                iconId="fr-icon-file-text-line"
                priority="secondary"
                linkProps={
                  routes.assessmentDocument({
                    jwt: isConventionMagicLinkJwt ? jwtParams.jwt : undefined,
                    conventionId: convention.id,
                  }).link
                }
              >
                Consulter le bilan
              </Button>
            )}

            {shouldShowAssessmentAbandonAction &&
              intersection(roles, [
                ...establishmentsRoles,
                ...conventionEstablishmentsRoles,
              ]).length > 0 && (
                <FillAssessmentButton
                  id={domElementIds.manageConvention.abandonAssessmentButton}
                  label="Déclarer un abandon"
                  modalTitle="Déclarer un abandon"
                  modalMessage="Seule la personne désignée comme tuteur ou tutrice dans la convention peut déclarer un abandon. N'hésitez pas à transmettre l'information au bon interlocuteur."
                  roles={roles}
                  convention={convention}
                  onClick={() =>
                    routes
                      .assessment({
                        jwt: jwtParams.jwt,
                        conventionId: convention.id,
                      })
                      .push()
                  }
                />
              )}

            {shouldShowAssessmentFullFillAction && (
              <FillAssessmentButton
                id={domElementIds.manageConvention.assessmentFullFillButton}
                label="Compléter le bilan"
                modalTitle="Compléter le bilan"
                modalMessage="Seule la personne désignée comme tuteur ou tutrice dans la convention peut remplir le bilan d'immersion. N'hésitez pas à transmettre l'information au bon interlocuteur."
                roles={roles}
                convention={convention}
                onClick={() =>
                  routes
                    .assessment({
                      jwt: jwtParams.jwt,
                      conventionId: convention.id,
                    })
                    .push()
                }
              />
            )}

            {shouldShowConventionDocumentButton && (
              <Button
                iconId="fr-icon-file-pdf-line"
                className={fr.cx("fr-m-1w")}
                priority="secondary"
                linkProps={
                  routes.conventionDocument({
                    jwt: isConventionMagicLinkJwt ? jwtParams.jwt : undefined,
                    conventionId: convention.id,
                  }).link
                }
                id={domElementIds.manageConvention.openDocumentButton}
              >
                Voir la convention
              </Button>
            )}
          </>
        }

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
            "agency-viewer",
          ]) &&
          (broadcastErrorFeedback && !currentUser.isBackofficeAdmin ? (
            <ErroredConventionActions
              conventionId={convention.id}
              jwt={jwtParams.jwt as ConnectedUserJwt}
              currentUser={currentUser}
            />
          ) : (
            <BroadcastAgainButton conventionId={convention.id} />
          ))}
      </div>
    </div>
  );
};

const notEnoughRightToFillAssessmentModal = createModal({
  isOpenedByDefault: false,
  id: "im-not-enough-right-to-fill-assessment-modal",
});

type FillAssessmentButtonProps = {
  id: string;
  label: string;
  modalTitle: string;
  modalMessage: string;
  roles: Role[];
  convention: ConventionReadDto;
  onClick?: () => void;
};

const FillAssessmentButton = ({
  id,
  label,
  modalTitle,
  modalMessage,
  roles,
  convention,
  onClick,
}: FillAssessmentButtonProps) => {
  const handleClick = () => {
    if (!hasAllowedRoleOnAssessment(roles, "CreateAssessment", convention)) {
      notEnoughRightToFillAssessmentModal.open();
    } else {
      onClick?.();
    }
  };

  return (
    <>
      <Button
        id={id}
        iconId="fr-icon-file-text-line"
        priority="secondary"
        onClick={handleClick}
      >
        {label}
      </Button>
      {createPortal(
        <notEnoughRightToFillAssessmentModal.Component
          title={modalTitle}
          buttons={[
            {
              doClosesModal: true,
              children: "J'ai compris",
            },
          ]}
        >
          {modalMessage}
        </notEnoughRightToFillAssessmentModal.Component>,
        document.body,
      )}
    </>
  );
};

const broadcastAgainModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.manageConvention.broadcastAgainModal,
});

const erroredConventionHandledConfirmationModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.manageConvention.erroredConventionHandledModal,
});

type ErroredConventionActionsProps = {
  conventionId: string;
  jwt: ConnectedUserJwt;
  currentUser: ConnectedUser;
};

const ErroredConventionActions = ({
  conventionId,
  jwt,
  currentUser,
}: ErroredConventionActionsProps) => {
  const dispatch = useDispatch();
  const isPeUser = currentUser?.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.kind === "pole-emploi" &&
      !agencyRight.roles.includes("to-review"),
  );

  const isBroadcasting = useAppSelector(
    conventionActionSelectors.isBroadcasting,
  );
  const consumerNames = useAppSelector(apiConsumerSelectors.apiConsumerNames);
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const hasErrorFeedback =
    feedbacks["broadcast-convention-again"]?.level === "error";

  const methods = useForm<MarkPartnersErroredConventionAsHandledRequest>({
    resolver: zodResolver(markPartnersErroredConventionAsHandledRequestSchema),
    mode: "onTouched",
    defaultValues: {
      conventionId,
    },
  });

  const onSubmit = ({
    conventionId,
  }: MarkPartnersErroredConventionAsHandledRequest) => {
    dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt,
        markAsHandledParams: { conventionId },
        feedbackTopic: "partner-conventions",
      }),
    );
    erroredConventionHandledConfirmationModal.close();
  };

  useEffect(() => {
    if (jwt && conventionId) {
      dispatch(
        apiConsumerSlice.actions.fetchApiConsumerNamesRequested({
          conventionId,
          jwt: jwt,
          feedbackTopic: "api-consumer-names",
        }),
      );
    }
    return () => {
      dispatch(apiConsumerSlice.actions.clearFetchedApiConsumerNames());
    };
  }, [jwt, conventionId, dispatch]);

  return (
    <>
      <ButtonWithSubMenu
        buttonLabel="Gérer la synchronisation"
        openedTop={true}
        navItems={[
          {
            id: domElementIds.manageConvention.openMarkConventionAsHandledModal,
            children: "Marquer la convention comme traitée",
            onClick: () => erroredConventionHandledConfirmationModal.open(),
          },
          {
            id: domElementIds.manageConvention
              .openBroadcastConventionAgainModal,
            children: "Resynchroniser dans votre applicatif",
            onClick: () => broadcastAgainModal.open(),
          },
        ]}
        priority="secondary"
        buttonIconId="fr-icon-arrow-down-s-line"
        iconPosition="right"
        id="errored-convention-actions-button"
      />

      {createPortal(
        <broadcastAgainModal.Component
          title="Rediffuser dans votre SI ou système applicatif"
          buttons={[
            {
              doClosesModal: true,
              children: "Fermer",
            },
            {
              id: domElementIds.manageConvention.broadcastConventionAgainButton,
              doClosesModal: false,
              children: "Rediffuser",
              disabled: isBroadcasting || hasErrorFeedback,
              onClick: () => {
                dispatch(
                  conventionActionSlice.actions.broadcastConventionToPartnerRequested(
                    {
                      conventionId: conventionId,
                      feedbackTopic: "broadcast-convention-again",
                    },
                  ),
                );
              },
            },
          ]}
        >
          Vous allez rediffuser aux SI ou système applicatifs suivant :
          <ul>
            {consumerNames.map((consumerName) => (
              <li key={consumerName}>{consumerName}</li>
            ))}
          </ul>
          <Feedback topics={["broadcast-convention-again"]} />
        </broadcastAgainModal.Component>,
        document.body,
      )}

      {createPortal(
        <erroredConventionHandledConfirmationModal.Component title="Confirmation de saisie">
          <p>
            Vous allez marquer une convention comme traitée l'avez vous saisie
            manuellement ?
          </p>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <ButtonsGroup
                className={fr.cx("fr-mt-4w", "fr-mb-2w")}
                buttonsEquisized
                alignment="center"
                inlineLayoutWhen="always"
                buttons={[
                  {
                    id: domElementIds.manageConvention
                      .markConventionAsHandledButton,
                    children: "Oui (Marquer la convention comme traitée)",
                    priority: "primary",
                    type: "submit",
                  },
                  {
                    children:
                      "Non (Ne pas marquer la convention comme traitée)",
                    priority: "secondary",
                    onClick: () =>
                      erroredConventionHandledConfirmationModal.close(),
                  },
                ]}
              />
            </form>
          </FormProvider>

          {isPeUser && (
            <p>
              Si nécessaire, vous pouvez retrouver les instructions détaillées
              pour la saisie d'une convention en cliquant sur le lien suivant:{" "}
              <a
                href="https://poleemploi.sharepoint.com/:p:/r/sites/NAT-Mediatheque-Appropriation/Documents/Immersion_facilitee/Immersion_facilitee/Guide_de_gestion_des_conventions_en_erreur.pptx?d=w489a3c6b6e5148e6bea287ddfadba8c7&csf=1&web=1&e=i1GD5H"
                target="_blank"
                rel="noreferrer"
              >
                Guide de gestion des conventions en erreur
              </a>
            </p>
          )}
        </erroredConventionHandledConfirmationModal.Component>,
        document.body,
      )}
    </>
  );
};
