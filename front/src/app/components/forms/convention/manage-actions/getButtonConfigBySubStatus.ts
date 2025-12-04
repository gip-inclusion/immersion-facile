/** biome-ignore-all lint/complexity/useLiteralKeys: false positive */

import { intersection } from "ramda";
import type { Dispatch, SetStateAction } from "react";
import {
  allowedRolesToCreateAssessment,
  type ConnectedUser,
  type ConventionReadDto,
  type ConventionStatus,
  domElementIds,
  type EditConventionCounsellorNameRequestDto,
  establishmentsRoles,
  hasAllowedRole,
  hasAllowedRoleOnAssessment,
  isConventionRenewed,
  isConventionValidated,
  type MarkPartnersErroredConventionAsHandledRequest,
  type RenewConventionParams,
  type Role,
  type SubscriberErrorFeedback,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  userHasEnoughRightsOnConvention,
  type WithConventionId,
} from "shared";
import type { ButtonArea } from "src/app/components/admin/conventions/renderButtonsBySubStatus";
import {
  getVerificationActionProps,
  type VerificationAction,
  type VerificationActionProps,
} from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { getConventionSubStatus } from "src/app/utils/conventionSubStatus";
import { isAllowedConventionTransition } from "src/app/utils/IsAllowedConventionTransition";
import {
  canAssessmentBeFilled,
  isConventionEndingInOneDayOrMore,
} from "src/core-logic/domain/convention/convention.utils";
import { match, P } from "ts-pattern";
export type ButtonConfiguration = {
  props: VerificationActionProps;
  isVisibleForUserRights: boolean;
  buttonArea: ButtonArea;
};

type CreateButtonConfigurationsBySubStatusParams = {
  convention: ConventionReadDto;
  jwt: string;
  disabledButtons: Partial<Record<VerificationAction, boolean>>;
  requesterRoles: Role[];
  createOnSubmitWithFeedbackKind: (
    verificationAction: VerificationAction,
    params:
      | UpdateConventionStatusRequestDto
      | TransferConventionToAgencyRequestDto
      | RenewConventionParams
      | EditConventionCounsellorNameRequestDto
      | WithConventionId
      | MarkPartnersErroredConventionAsHandledRequest,
  ) => void;
  setValidatorWarningMessage: Dispatch<SetStateAction<string | null>>;
  currentUser: ConnectedUser | null;
  broadcastErrorFeedback: SubscriberErrorFeedback | null;
};

export const getButtonConfigBySubStatus = (
  params: CreateButtonConfigurationsBySubStatusParams,
): ButtonConfiguration[] => {
  const { convention, broadcastErrorFeedback } = params;

  const activeSubStatus = getConventionSubStatus(
    convention,
    !!broadcastErrorFeedback,
  );

  const buttonPropsByVerificationAction =
    createButtonPropsByVerificationAction(params);

  return match(activeSubStatus)
    .with(
      P.union(
        "readyToSignWithoutBroadcastError",
        "partiallySignedWithoutBroadcastError",
      ),
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["REJECT"],
        buttonPropsByVerificationAction["DEPRECATE"],
        buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
        buttonPropsByVerificationAction["TRANSFER"],
        buttonPropsByVerificationAction["EDIT_CONVENTION"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["SIGN"],
      ],
    )
    .with(
      P.union(
        "readyToSignWithBroadcastError",
        "partiallySignedWithBroadcastError",
      ),
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["REJECT"],
        buttonPropsByVerificationAction["DEPRECATE"],
        buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
        buttonPropsByVerificationAction["TRANSFER"],
        buttonPropsByVerificationAction["EDIT_CONVENTION"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["MARK_AS_HANDLED"],
        buttonPropsByVerificationAction["SIGN"],
      ],
    )
    .with("inReviewWithSingleValidationWithoutBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["TRANSFER"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["ACCEPT_VALIDATOR"],
    ])
    .with("inReviewWithSingleValidationWithBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["TRANSFER"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["MARK_AS_HANDLED"],
      buttonPropsByVerificationAction["ACCEPT_VALIDATOR"],
    ])
    .with("inReviewWithDoubleValidationWithoutBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["TRANSFER"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["ACCEPT_COUNSELLOR"],
    ])
    .with("inReviewWithDoubleValidationWithBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["TRANSFER"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["MARK_AS_HANDLED"],
      buttonPropsByVerificationAction["ACCEPT_COUNSELLOR"],
    ])
    .with("acceptedByCounsellorWithoutBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["ACCEPT_VALIDATOR"],
    ])
    .with("acceptedByCounsellorWithBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["REJECT"],
      buttonPropsByVerificationAction["DEPRECATE"],
      buttonPropsByVerificationAction["EDIT_COUNSELLOR_NAME"],
      buttonPropsByVerificationAction["EDIT_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["MARK_AS_HANDLED"],
      buttonPropsByVerificationAction["ACCEPT_VALIDATOR"],
    ])
    .with("acceptedByValidatorWithAssessmentWithoutBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["ACCESS_ASSESSMENT"],
      buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["RENEW"],
    ])
    .with("acceptedByValidatorWithAssessmentWithBroadcastError", () => [
      buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
      buttonPropsByVerificationAction["ACCESS_ASSESSMENT"],
      buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      buttonPropsByVerificationAction["MARK_AS_HANDLED"],
      buttonPropsByVerificationAction["RENEW"],
    ])
    .with(
      "acceptedByValidatorWithoutAssessmentDidNotStartWithoutBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      ],
    )
    .with(
      "acceptedByValidatorWithoutAssessmentDidNotStartWithBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["MARK_AS_HANDLED"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      ],
    )
    .with(
      "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithoutBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["DECLARE_ABANDONMENT"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      ],
    )
    .with(
      "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["DECLARE_ABANDONMENT"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["MARK_AS_HANDLED"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
      ],
    )
    .with(
      "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithoutBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
        buttonPropsByVerificationAction["FILL_ASSESSMENT"],
        buttonPropsByVerificationAction["FILL_ASSESSMENT_INFO"],
      ],
    )
    .with(
      "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithBroadcastError",
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["CANCEL"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["MARK_AS_HANDLED"],
        buttonPropsByVerificationAction["RENEW"],
        buttonPropsByVerificationAction["ACCESS_CONVENTION"],
        buttonPropsByVerificationAction["FILL_ASSESSMENT"],
        buttonPropsByVerificationAction["FILL_ASSESSMENT_INFO"],
      ],
    )
    .with(
      P.union(
        "rejectedWithoutBroadcastError",
        "cancelledWithoutBroadcastError",
        "deprecatedWithoutBroadcastError",
      ),
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
      ],
    )
    .with(
      P.union(
        "rejectedWithBroadcastError",
        "cancelledWithBroadcastError",
        "deprecatedWithBroadcastError",
      ),
      () => [
        buttonPropsByVerificationAction["DUPLICATE_CONVENTION"],
        buttonPropsByVerificationAction["BROADCAST_AGAIN"],
        buttonPropsByVerificationAction["MARK_AS_HANDLED"],
      ],
    )
    .exhaustive();
};

const createButtonPropsByVerificationAction = (
  params: CreateButtonConfigurationsBySubStatusParams,
): Record<VerificationAction, ButtonConfiguration> => {
  const {
    convention,
    jwt,
    disabledButtons,
    requesterRoles,
    createOnSubmitWithFeedbackKind,
    setValidatorWarningMessage,
    currentUser,
    broadcastErrorFeedback,
  } = params;
  const t = useConventionTexts(convention?.internshipKind ?? "immersion");
  const renewFeedback = useFeedbackTopic("convention-action-renew");

  const allowedToTransferStatuses: ConventionStatus[] = [
    "IN_REVIEW",
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];

  const shouldShowAssessmentDocumentAction =
    !!convention.assessment &&
    hasAllowedRoleOnAssessment(requesterRoles, "GetAssessment", convention);

  const shouldShowAssessmentAbandonAction =
    canAssessmentBeFilled(convention) &&
    isConventionEndingInOneDayOrMore(convention) &&
    hasAllowedRoleOnAssessment(requesterRoles, "CreateAssessment", convention);

  const shouldShowAssessmentFullFillAction =
    canAssessmentBeFilled(convention) &&
    !isConventionEndingInOneDayOrMore(convention) &&
    intersection(requesterRoles, [...allowedRolesToCreateAssessment]).length >
      0;

  const shouldShowFillAssessmentInfoButton =
    canAssessmentBeFilled(convention) &&
    !isConventionEndingInOneDayOrMore(convention) &&
    intersection(requesterRoles, [
      ...establishmentsRoles,
      "establishment-representative",
    ]).length > 0 &&
    intersection(requesterRoles, [...allowedRolesToCreateAssessment]).length ===
      0;

  const allowedToSignStatuses: ConventionStatus[] = [
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];

  const shouldShowSignatureAction =
    requesterRoles.includes("establishment-representative") &&
    !convention.signatories.establishmentRepresentative.signedAt &&
    !currentUser?.isBackofficeAdmin &&
    allowedToSignStatuses.includes(convention.status);

  const shouldShowConventionDocumentButton =
    convention.status === "ACCEPTED_BY_VALIDATOR";

  const shouldShowRenewConventionButton =
    isConventionValidated(convention) &&
    !isConventionRenewed(convention) &&
    hasAllowedRole({
      allowedRoles: ["counsellor", "validator"],
      candidateRoles: requesterRoles,
    });

  const shouldShowBroadcastAgainButton =
    !!currentUser &&
    userHasEnoughRightsOnConvention(currentUser, convention, [
      "counsellor",
      "validator",
      "agency-viewer",
    ]);

  const shouldShowMarkAsHandledButton =
    shouldShowBroadcastAgainButton && !!broadcastErrorFeedback;

  const shouldShowCancelButton =
    isAllowedConventionTransition(convention, "CANCELLED", requesterRoles) &&
    !convention.assessment;

  const shouldShowTransferButton = () => {
    if (
      currentUser?.isBackofficeAdmin &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;
    if (
      intersection(requesterRoles, [
        "agency-admin",
        "counsellor",
        "validator",
        "back-office",
      ]).length > 0 &&
      allowedToTransferStatuses.includes(convention.status)
    )
      return true;

    return false;
  };

  const shouldShowModifyConventionButton = () => {
    if (
      convention.status === "ACCEPTED_BY_COUNSELLOR" &&
      convention.agencyRefersTo &&
      !requesterRoles.includes("counsellor")
    )
      return false;
    return isAllowedConventionTransition(
      convention,
      "READY_TO_SIGN",
      requesterRoles,
    );
  };

  return {
    DUPLICATE_CONVENTION: {
      props: getVerificationActionProps({
        verificationAction: "DUPLICATE_CONVENTION",
        children: "Dupliquer la convention",
        convention,
        jwt,
        buttonId: domElementIds.manageConvention.duplicateConventionButton,
      }),
      isVisibleForUserRights: true,
      buttonArea: "otherActionArea",
    },
    REJECT: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.rejectConvention,
        modalTitle: t.verification.rejectConvention,
        verificationAction: "REJECT",
        convention,
        disabled: disabledButtons["REJECT"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId:
          domElementIds.manageConvention.conventionValidationRejectButton,
      }),
      isVisibleForUserRights: isAllowedConventionTransition(
        convention,
        "REJECTED",
        requesterRoles,
      ),
      buttonArea: "cancelationArea",
    },
    CANCEL: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.markAsCancelled,
        modalTitle: t.verification.markAsCancelled,
        verificationAction: "CANCEL",
        convention,
        disabled:
          disabledButtons["CANCEL"] ||
          convention.status !== "ACCEPTED_BY_VALIDATOR",
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId:
          domElementIds.manageConvention.conventionValidationCancelButton,
      }),
      isVisibleForUserRights: shouldShowCancelButton,
      buttonArea: "cancelationArea",
    },
    EDIT_COUNSELLOR_NAME: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.modifyCounsellorName,
        modalTitle: t.verification.modifyCounsellorNameTitle,
        verificationAction: "EDIT_COUNSELLOR_NAME",
        convention,
        disabled: disabledButtons["EDIT_COUNSELLOR_NAME"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId: domElementIds.manageConvention.editCounsellorNameButton,
      }),
      isVisibleForUserRights: isAllowedConventionTransition(
        convention,
        "READY_TO_SIGN",
        requesterRoles,
      ),
      buttonArea: "editionArea",
    },
    TRANSFER: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.modifyConventionAgency,
        modalTitle: t.verification.modifyConventionAgencyTitle,
        verificationAction: "TRANSFER",
        convention,
        disabled: disabledButtons["TRANSFER"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId: domElementIds.manageConvention.transferToAgencyButton,
      }),
      isVisibleForUserRights: shouldShowTransferButton(),
      buttonArea: "editionArea",
    },
    EDIT_CONVENTION: {
      props: getVerificationActionProps({
        children: t.verification.modifyConventionOtherInformations,
        verificationAction: "EDIT_CONVENTION",
        convention,
        disabled:
          disabledButtons["TRANSFER"] ||
          disabledButtons["EDIT_COUNSELLOR_NAME"],
        jwt,
        buttonId: domElementIds.manageConvention.editLink,
      }),
      isVisibleForUserRights: shouldShowModifyConventionButton(),
      buttonArea: "editionArea",
    },
    BROADCAST_AGAIN: {
      props: getVerificationActionProps({
        children: t.verification.broadcastConventionAgain,
        verificationAction: "BROADCAST_AGAIN",
        convention,
        disabled: disabledButtons["BROADCAST_AGAIN"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        initialStatus: convention.status,
        modalTitle: t.verification.broadcastConventionAgainTitle,
        buttonId: domElementIds.manageConvention.broadcastConventionAgainButton,
      }),
      isVisibleForUserRights: shouldShowBroadcastAgainButton,
      buttonArea: "otherActionArea",
    },
    ACCEPT_COUNSELLOR: {
      props: getVerificationActionProps({
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
        disabled:
          disabledButtons["ACCEPT_COUNSELLOR"] ||
          convention.status !== "IN_REVIEW",
        convention,
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId:
          domElementIds.manageConvention.conventionValidationValidateButton,
        iconId: "fr-icon-checkbox-circle-line",
        iconPosition: "left",
      }),
      isVisibleForUserRights: isAllowedConventionTransition(
        convention,
        "ACCEPTED_BY_COUNSELLOR",
        requesterRoles,
      ),
      buttonArea: "validationArea",
    },
    ACCEPT_VALIDATOR: {
      props: getVerificationActionProps({
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
        onCloseValidatorModalWithoutValidatorInfo: setValidatorWarningMessage,
        buttonId:
          domElementIds.manageConvention.conventionValidationValidateButton,
        iconId: "fr-icon-checkbox-circle-line",
        iconPosition: "left",
        disabled:
          disabledButtons["ACCEPT_VALIDATOR"] ||
          (convention.status !== "IN_REVIEW" &&
            convention.status !== "ACCEPTED_BY_COUNSELLOR"),
      }),
      isVisibleForUserRights: isAllowedConventionTransition(
        convention,
        "ACCEPTED_BY_VALIDATOR",
        requesterRoles,
      ),
      buttonArea: "validationArea",
    },
    RENEW: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: "Renouveler la convention",
        modalTitle: "Renouvellement de convention",
        verificationAction: "RENEW",
        convention,
        disabled: renewFeedback?.level === "success",
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId: domElementIds.manageConvention.openRenewModalButton,
      }),
      isVisibleForUserRights: shouldShowRenewConventionButton,
      buttonArea: "otherActionArea",
    },
    DECLARE_ABANDONMENT: {
      props: getVerificationActionProps({
        verificationAction: "DECLARE_ABANDONMENT",
        children: "Déclarer un abandon",
        jwt,
        convention,
        buttonId: domElementIds.manageConvention.abandonAssessmentButton,
      }),
      isVisibleForUserRights: shouldShowAssessmentAbandonAction,
      buttonArea: "cancelationArea",
    },
    ACCESS_CONVENTION: {
      props: getVerificationActionProps({
        verificationAction: "ACCESS_CONVENTION",
        children: "Voir la convention",
        jwt,
        convention,
        buttonId: domElementIds.manageConvention.openDocumentButton,
        iconId: "fr-icon-file-text-line",
        iconPosition: "left",
      }),
      isVisibleForUserRights: shouldShowConventionDocumentButton,
      buttonArea: "conventionArea",
    },
    ACCESS_ASSESSMENT: {
      props: getVerificationActionProps({
        verificationAction: "ACCESS_ASSESSMENT",
        children: "Consulter le bilan",
        jwt,
        convention,
        buttonId: domElementIds.manageConvention.assessmentDocumentButton,
        iconId: "fr-icon-file-text-line",
        iconPosition: "left",
      }),
      isVisibleForUserRights: shouldShowAssessmentDocumentAction,
      buttonArea: "assessmentArea",
    },
    FILL_ASSESSMENT: {
      props: getVerificationActionProps({
        verificationAction: "FILL_ASSESSMENT",
        children: "Compléter le bilan",
        jwt,
        convention,
        buttonId: domElementIds.manageConvention.assessmentFullFillButton,
      }),
      isVisibleForUserRights: shouldShowAssessmentFullFillAction,
      buttonArea: "assessmentArea",
    },
    FILL_ASSESSMENT_INFO: {
      props: getVerificationActionProps({
        verificationAction: "FILL_ASSESSMENT_INFO",
        children: "Compléter le bilan",
        modalTitle: "Compléter le bilan",
        initialStatus: convention.status,
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        convention,
        buttonId: domElementIds.manageConvention.assessmentFullFillButton,
      }),
      isVisibleForUserRights: shouldShowFillAssessmentInfoButton,
      buttonArea: "assessmentArea",
    },
    DEPRECATE: {
      props: getVerificationActionProps({
        initialStatus: convention.status,
        children: t.verification.markAsDeprecated,
        modalTitle: t.verification.markAsDeprecated,
        verificationAction: "DEPRECATE",
        convention,
        disabled: disabledButtons["DEPRECATE"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId:
          domElementIds.manageConvention.conventionValidationDeprecateButton,
      }),
      isVisibleForUserRights: isAllowedConventionTransition(
        convention,
        "DEPRECATED",
        requesterRoles,
      ),
      buttonArea: "cancelationArea",
    },
    MARK_AS_HANDLED: {
      props: getVerificationActionProps({
        verificationAction: "MARK_AS_HANDLED",
        children: "Marquer la convention comme traitée",
        modalTitle: "Marquer la convention comme traitée",
        initialStatus: convention.status,
        convention,
        disabled: disabledButtons["MARK_AS_HANDLED"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId:
          domElementIds.manageConvention.openMarkConventionAsHandledModal,
      }),
      isVisibleForUserRights: shouldShowMarkAsHandledButton,
      buttonArea: "otherActionArea",
    },
    SIGN: {
      props: getVerificationActionProps({
        verificationAction: "SIGN",
        children: "Signer la convention",
        modalTitle:
          "Accepter les dispositions réglementaires et terminer la signature",
        initialStatus: convention.status,
        convention,
        disabled: disabledButtons["SIGN"],
        currentSignatoryRoles: requesterRoles,
        onSubmit: createOnSubmitWithFeedbackKind,
        buttonId: domElementIds.manageConvention.openSignModalButton,
      }),
      isVisibleForUserRights: shouldShowSignatureAction,
      buttonArea: "signatureArea",
    },
  };
};
