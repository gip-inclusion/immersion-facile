import { createModal, type ModalProps } from "@codegouvfr/react-dsfr/Modal";
import type { ComponentType } from "react";
import { type ConventionStatusWithJustification, domElementIds } from "shared";
import type { VerificationActionWithModal } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import {
  createFormModal,
  type FormModalProps,
} from "src/app/utils/createFormModal";

const confirmByStatus: Record<ConventionStatusWithJustification, string> = {
  REJECTED: "Confirmer le refus",
  CANCELLED: "Confirmer l'annulation",
  DEPRECATED: "Confirmer que la demande est obsolète",
};

const submitButtonIdByStatus: Record<
  ConventionStatusWithJustification,
  string
> = {
  REJECTED: domElementIds.manageConvention.rejectedModalSubmitButton,
  CANCELLED: domElementIds.manageConvention.cancelModalSubmitButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalSubmitButton,
};

const cancelButtonIdByStatus: Record<
  ConventionStatusWithJustification,
  string
> = {
  REJECTED: domElementIds.manageConvention.rejectedModalCancelButton,
  CANCELLED: domElementIds.manageConvention.cancelModalCancelButton,
  DEPRECATED: domElementIds.manageConvention.deprecatedModalCancelButton,
};

const createRejectModalParams = {
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
};
const {
  Component: RejectModal,
  open: openRejectModal,
  close: closeRejectModal,
} = createFormModal(createRejectModalParams);

const createCancelModalParams = {
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
};
const {
  Component: CancelModal,
  open: openCancelModal,
  close: closeCancelModal,
} = createFormModal(createCancelModalParams);

const createDeprecatedModalParams = {
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
};
const {
  Component: DeprecateModal,
  open: openDeprecateModal,
  close: closeDeprecateModal,
} = createFormModal(createDeprecatedModalParams);

const createValidatorModalParams = {
  id: domElementIds.manageConvention.validatorModal,
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.validatorModalForm,
  submitButton: {
    id: domElementIds.manageConvention.validatorModalSubmitButton,
    children: "Valider la demande",
  },
  cancelButton: {
    id: domElementIds.manageConvention.validatorModalCancelButton,
    children: "Annuler et revenir en arrière",
  },
};
const {
  Component: ValidatorModal,
  open: openValidatorModal,
  close: closeValidatorModal,
} = createFormModal(createValidatorModalParams);

const createTransferConventionModalParams = {
  id: domElementIds.manageConvention.transferConventionModal,
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.transferConventionModalForm,
};
const {
  Component: TransferConventionModal,
  open: openTransferConventionModal,
  close: closeTransferConventionModal,
} = createFormModal(createTransferConventionModalParams);

const createEditCounsellorNameModalParams = {
  id: domElementIds.manageConvention.editCounsellorNameModal,
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.editCounsellorNameModalForm,
};
const {
  Component: EditCounsellorNameModal,
  open: openEditCounsellorNameModal,
  close: closeEditCounsellorNameModal,
} = createFormModal(createEditCounsellorNameModalParams);

const createRenewConventionModalParams = {
  id: domElementIds.manageConvention.renewModal,
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.renewModalForm,
  submitButton: {
    id: domElementIds.manageConvention.submitRenewModalButton,
    children: "Renouveler la convention",
  },
  cancelButton: {
    id: domElementIds.manageConvention.renewModalCancelButton,
    children: "Annuler et revenir en arrière",
  },
};

const {
  Component: RenewConventionModal,
  open: openRenewConventionModal,
  close: closeRenewConventionModal,
} = createFormModal(createRenewConventionModalParams);

const createBroadcastAgainModalParams = {
  id: domElementIds.manageConvention.broadcastAgainModal,
  isOpenedByDefault: false,
};
const {
  Component: BroadcastAgainModal,
  open: openBroadcastAgainModal,
  close: closeBroadcastAgainModal,
} = createModal(createBroadcastAgainModalParams);

const createMarkAsHandledModalParams = {
  id: domElementIds.manageConvention.erroredConventionHandledModal,
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.erroredConventionHandledModal,
};
const {
  Component: MarkAsHandledModal,
  open: openMarkAsHandledModal,
  close: closeMarkAsHandledModal,
} = createFormModal(createMarkAsHandledModalParams);

const createFillAssessmentInfoModalParams = {
  id: domElementIds.manageConvention.fillAssessmentInfoModal,
  isOpenedByDefault: false,
};
const {
  Component: FillAssessmentInfoModal,
  open: openFillAssessmentInfoModal,
  close: closeFillAssessmentInfoModal,
} = createModal(createFillAssessmentInfoModalParams);

const createSignModalParams = {
  id: domElementIds.manageConvention.sendSignatureLinkModal, //TODO: check if this is correct
  isOpenedByDefault: false,
  formId: domElementIds.manageConvention.sendSignatureLinkModalForm,
};
const {
  Component: SignModal,
  open: openSignModal,
  close: closeSignModal,
} = createFormModal(createSignModalParams);

type ModalAction = {
  modal: ComponentType<FormModalProps> | ComponentType<ModalProps>;
  openModal: () => void;
  closeModal: () => void;
  createModalParams: Parameters<typeof createModal>[0];
  buttons?: ModalProps["buttons"];
};

export const modalByAction = (
  verificationAction: VerificationActionWithModal,
): ModalAction => {
  const modals: Record<VerificationActionWithModal, ModalAction> = {
    REJECT: {
      modal: RejectModal,
      openModal: openRejectModal,
      closeModal: closeRejectModal,
      createModalParams: createRejectModalParams,
    },
    CANCEL: {
      modal: CancelModal,
      openModal: openCancelModal,
      closeModal: closeCancelModal,
      createModalParams: createCancelModalParams,
    },
    DEPRECATE: {
      modal: DeprecateModal,
      openModal: openDeprecateModal,
      closeModal: closeDeprecateModal,
      createModalParams: createDeprecatedModalParams,
    },
    ACCEPT_COUNSELLOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
      createModalParams: createValidatorModalParams,
    },
    ACCEPT_VALIDATOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
      createModalParams: createValidatorModalParams,
    },
    TRANSFER: {
      modal: TransferConventionModal,
      openModal: openTransferConventionModal,
      closeModal: closeTransferConventionModal,
      createModalParams: createTransferConventionModalParams,
    },
    RENEW: {
      modal: RenewConventionModal,
      openModal: openRenewConventionModal,
      closeModal: closeRenewConventionModal,
      createModalParams: createRenewConventionModalParams,
    },
    EDIT_COUNSELLOR_NAME: {
      modal: EditCounsellorNameModal,
      openModal: openEditCounsellorNameModal,
      closeModal: closeEditCounsellorNameModal,
      createModalParams: createEditCounsellorNameModalParams,
    },
    BROADCAST_AGAIN: {
      modal: BroadcastAgainModal,
      openModal: openBroadcastAgainModal,
      closeModal: closeBroadcastAgainModal,
      createModalParams: createBroadcastAgainModalParams,
    },
    MARK_AS_HANDLED: {
      modal: MarkAsHandledModal,
      openModal: openMarkAsHandledModal,
      closeModal: closeMarkAsHandledModal,
      createModalParams: createMarkAsHandledModalParams,
    },
    FILL_ASSESSMENT_INFO: {
      modal: FillAssessmentInfoModal,
      openModal: openFillAssessmentInfoModal,
      closeModal: closeFillAssessmentInfoModal,
      createModalParams: createFillAssessmentInfoModalParams,
      buttons: [
        {
          children: "J'ai compris",
          type: "button",
          priority: "primary",
          onClick: closeSignModal,
        },
      ],
    },
    SIGN: {
      modal: SignModal,
      openModal: openSignModal,
      closeModal: closeSignModal,
      createModalParams: createSignModalParams,
    },
  };
  return modals[verificationAction];
};
