import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { domElementIds } from "shared";
import type { VerificationAction } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";

const createRejectModalParams = {
  id: domElementIds.manageConvention.rejectedModal,
  isOpenedByDefault: false,
};
const {
  Component: RejectModal,
  open: openRejectModal,
  close: closeRejectModal,
} = createModal(createRejectModalParams);

const createDraftModalParams = {
  id: domElementIds.manageConvention.draftModal,
  isOpenedByDefault: false,
};
const {
  Component: DraftModal,
  open: openDraftModal,
  close: closeDraftModal,
} = createModal(createDraftModalParams);

const createCancelModalParams = {
  id: domElementIds.manageConvention.cancelModal,
  isOpenedByDefault: false,
};
const {
  Component: CancelModal,
  open: openCancelModal,
  close: closeCancelModal,
} = createModal(createCancelModalParams);

const createDeprecatedModalParams = {
  id: domElementIds.manageConvention.deprecatedModal,
  isOpenedByDefault: false,
};
const {
  Component: DeprecateModal,
  open: openDeprecateModal,
  close: closeDeprecateModal,
} = createModal(createDeprecatedModalParams);

const createValidatorModalParams = {
  id: domElementIds.manageConvention.validatorModal,
  isOpenedByDefault: false,
};
const {
  Component: ValidatorModal,
  open: openValidatorModal,
  close: closeValidatorModal,
} = createModal(createValidatorModalParams);

const createTransferConventionModalParams = {
  id: domElementIds.manageConvention.transferConventionModal,
  isOpenedByDefault: false,
};
const {
  Component: TransferConventionModal,
  open: openTransferConventionModal,
  close: closeTransferConventionModal,
} = createModal(createTransferConventionModalParams);

const createRenewConventionModalParams = {
  id: domElementIds.manageConvention.renewModal,
  isOpenedByDefault: false,
};

const {
  Component: RenewConventionModal,
  open: openRenewConventionModal,
  close: closeRenewConventionModal,
} = createModal(createRenewConventionModalParams);

export const modalByAction = (verificationAction: VerificationAction) => {
  const modals = {
    REQUEST_EDIT: {
      modal: DraftModal,
      openModal: openDraftModal,
      closeModal: closeDraftModal,
      createModalParams: createDraftModalParams,
    },
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
  };
  return modals[verificationAction];
};
