import { createModal, type ModalProps } from "@codegouvfr/react-dsfr/Modal";
import type { ComponentType } from "react";
import { domElementIds, type UnvalidatedConventionStatus } from "shared";
import type { VerificationActionWithModal } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import {
  type CreateFormModalParams,
  createFormModal,
  type FormModalProps,
} from "src/app/utils/createFormModal";

type ModalAction = {
  modal: ComponentType<FormModalProps> | ComponentType<ModalProps>;
  openModal: () => void;
  closeModal: () => void;
  createModalParams: Parameters<typeof createModal>[0];
  buttons?: ModalProps["buttons"];
};

export const modalByAction = (
  verificationAction: VerificationActionWithModal,
): ModalAction => modals[verificationAction]();

const makeModalAction =
  (createModalParams: CreateFormModalParams) => (): ModalAction => {
    const {
      Component: modal,
      open: openModal,
      close: closeModal,
    } = createFormModal(createModalParams);

    return {
      modal,
      openModal,
      closeModal,
      createModalParams: createModalParams,
    };
  };

const confirmByStatus: Record<UnvalidatedConventionStatus, string> = {
  REJECTED: "Confirmer le refus",
  CANCELLED: "Confirmer l'annulation",
  DEPRECATED: "Confirmer que la demande est obsolète",
};

const submitButtonIdByStatus: Record<UnvalidatedConventionStatus, string> = {
  REJECTED: domElementIds.manageConvention.rejectedModalSubmitButton,
  CANCELLED: domElementIds.manageConvention.cancelModalSubmitButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalSubmitButton,
};

const cancelButtonIdByStatus: Record<UnvalidatedConventionStatus, string> = {
  REJECTED: domElementIds.manageConvention.rejectedModalCancelButton,
  CANCELLED: domElementIds.manageConvention.cancelModalCancelButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalCancelButton,
};

const modals: Record<VerificationActionWithModal, () => ModalAction> = {
  REJECT: makeModalAction({
    id: domElementIds.manageConvention.rejectedModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.rejectedModalForm,
    submitButton: {
      id: submitButtonIdByStatus.REJECTED,
      children: confirmByStatus.REJECTED,
    },
    cancelButton: {
      id: cancelButtonIdByStatus.REJECTED,
    },
    doSubmitClosesModal: false,
  }),
  CANCEL: makeModalAction({
    id: domElementIds.manageConvention.cancelModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.cancelModalForm,
    submitButton: {
      id: submitButtonIdByStatus.CANCELLED,
      children: confirmByStatus.CANCELLED,
    },
    cancelButton: {
      id: cancelButtonIdByStatus.CANCELLED,
    },
    doSubmitClosesModal: false,
  }),
  DEPRECATE: makeModalAction({
    id: domElementIds.manageConvention.deprecatedModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.deprecateModalForm,
    submitButton: {
      id: submitButtonIdByStatus.DEPRECATED,
      children: confirmByStatus.DEPRECATED,
    },
    cancelButton: {
      id: cancelButtonIdByStatus.DEPRECATED,
    },
    doSubmitClosesModal: false,
  }),
  DELETE_ASSESSMENT: makeModalAction({
    id: domElementIds.manageConvention.deleteAssessmentModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.deleteAssessmentModalForm,
    submitButton: {
      id: domElementIds.manageConvention.deleteAssessmentModalSubmitButton,
      children: "Supprimer le bilan",
    },
    cancelButton: {
      id: domElementIds.manageConvention.deleteAssessmentModalCancelButton,
      children: "Annuler",
    },
    doSubmitClosesModal: false,
  }),
  ACCEPT_COUNSELLOR: makeModalAction({
    id: domElementIds.manageConvention.counsellorModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.counsellorModalForm,
    submitButton: {
      id: domElementIds.manageConvention.counsellorModalSubmitButton,
      children: "Pré-valider la demande",
    },
  }),
  ACCEPT_VALIDATOR: makeModalAction({
    id: domElementIds.manageConvention.validatorModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.validatorModalForm,
    submitButton: {
      id: domElementIds.manageConvention.validatorModalSubmitButton,
      children: "Valider la demande",
    },
  }),
  TRANSFER: makeModalAction({
    id: domElementIds.manageConvention.transferConventionModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.transferConventionModalForm,
    doSubmitClosesModal: false,
    submitButton: {
      id: domElementIds.manageConvention.transferToAgencySubmitButton,
    },
    cancelButton: {
      id: domElementIds.manageConvention.transferToAgencyCancelButton,
    },
  }),
  RENEW: makeModalAction({
    id: domElementIds.manageConvention.renewModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.renewModalForm,
    doSubmitClosesModal: false,
    submitButton: {
      id: domElementIds.manageConvention.submitRenewModalButton,
      children: "Renouveler la convention",
    },
    cancelButton: {
      id: domElementIds.manageConvention.renewModalCancelButton,
      children: "Annuler et revenir en arrière",
    },
  }),
  EDIT_COUNSELLOR_NAME: makeModalAction({
    id: domElementIds.manageConvention.editCounsellorNameModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.editCounsellorNameModalForm,
    doSubmitClosesModal: false,
    submitButton: {
      id: domElementIds.manageConvention.editCounsellorNameModalSubmitButton,
    },
  }),
  EDIT_CONVENTION_WITH_FINAL_STATUS: makeModalAction({
    id: domElementIds.manageConvention.editConventionWithFinalStatusModal,
    isOpenedByDefault: false,
    formId:
      domElementIds.manageConvention.editConventionWithFinalStatusModalForm,
    doSubmitClosesModal: false,
    submitButton: {
      id: domElementIds.manageConvention
        .editConventionWithFinalStatusModalSubmitButton,
      children: "Sauvegarder les modifications",
    },
    cancelButton: {
      id: domElementIds.manageConvention
        .editConventionWithFinalStatusModalCancelButton,
      children: "Annuler",
    },
  }),
  BROADCAST_AGAIN: makeModalAction({
    formId: domElementIds.manageConvention.broadcastAgainModalForm,
    id: domElementIds.manageConvention.broadcastAgainModal,
    isOpenedByDefault: false,
    submitButton: { children: "Rediffuser" },
    doSubmitClosesModal: false,
  }),
  MARK_AS_HANDLED: makeModalAction({
    id: domElementIds.manageConvention.erroredConventionHandledModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.erroredConventionHandledModal,
  }),
  FILL_ASSESSMENT_INFO: () => {
    const createFillAssessmentInfoModalParams = {
      id: domElementIds.manageConvention.fillAssessmentInfoModal,
      isOpenedByDefault: false,
    };
    const {
      Component: FillAssessmentInfoModal,
      open: openFillAssessmentInfoModal,
      close: closeFillAssessmentInfoModal,
    } = createModal(createFillAssessmentInfoModalParams);

    return {
      modal: FillAssessmentInfoModal,
      openModal: openFillAssessmentInfoModal,
      closeModal: closeFillAssessmentInfoModal,
      createModalParams: createFillAssessmentInfoModalParams,
      buttons: [
        {
          children: "J'ai compris",
          type: "button",
          priority: "primary",
          onClick: closeFillAssessmentInfoModal,
        },
      ],
    };
  },
  SIGN: makeModalAction({
    id: domElementIds.manageConvention.signModal,
    isOpenedByDefault: false,
    formId: domElementIds.manageConvention.signModalForm,
  }),
};
