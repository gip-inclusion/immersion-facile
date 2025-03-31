import type { FrIconClassName } from "@codegouvfr/react-dsfr";
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Dispatch, Fragment, type SetStateAction, useState } from "react";
import { createPortal } from "react-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionStatus,
  type ConventionStatusWithValidator,
  type Role,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  type WithValidatorInfo,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
  domElementIds,
  withValidatorInfoSchema,
} from "shared";
import { TransferConventionModalContent } from "src/app/components/forms/convention/TransferConventionModalContent";
import { JustificationModalContent } from "./JustificationModalContent";

export type VerificationActionButtonProps = {
  onSubmit: (
    params:
      | UpdateConventionStatusRequestDto
      | TransferConventionToAgencyRequestDto,
  ) => void;
  disabled?: boolean;
  initialStatus: ConventionStatus;
  verificationAction: VerificationAction;
  children: string;
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
  modalTitle: string;
};

const newStatusByVerificationAction = {
  ACCEPT_COUNSELLOR: "ACCEPTED_BY_COUNSELLOR",
  ACCEPT_VALIDATOR: "ACCEPTED_BY_VALIDATOR",
  REQUEST_EDIT: "DRAFT",
  REJECT: "REJECTED",
  CANCEL: "CANCELLED",
  DEPRECATE: "DEPRECATED",
  TRANSFER: null,
} satisfies Record<string, ConventionStatus | null>;

type VerificationAction = keyof typeof newStatusByVerificationAction;

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
  id: domElementIds.manageConvention.edit.requestEditModal,
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
  id: domElementIds.manageConvention.edit.transferToAgencyModal,
  isOpenedByDefault: false,
};
const {
  Component: TransferConventionModal,
  open: openTransferConventionModal,
  close: closeTransferConventionModal,
} = createModal(createTransferConventionModalParams);

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
  };
  return modals[verificationAction];
};

export const getVerificationActionButtonProps = ({
  verificationAction,
  disabled,
  children,
  onSubmit,
  convention,
  currentSignatoryRoles,
  initialStatus,
  onCloseValidatorModalWithoutValidatorInfo,
  modalTitle,
}: VerificationActionButtonProps): {
  buttonProps: ButtonProps & { id: string; children: string };
  modalWrapperProps: ModalWrapperProps;
} => {
  const iconByAction: Partial<Record<VerificationAction, FrIconClassName>> = {
    REJECT: "fr-icon-close-circle-line",
    REQUEST_EDIT: "fr-icon-edit-line",
    CANCEL: "fr-icon-delete-bin-line",
  };
  const selectedIcon = iconByAction[verificationAction];
  const actionButtonStatusId: Record<VerificationAction, string> = {
    REQUEST_EDIT: domElementIds.manageConvention.edit.requestEditButton,
    REJECT: domElementIds.manageConvention.conventionValidationRejectButton,
    ACCEPT_VALIDATOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    ACCEPT_COUNSELLOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    CANCEL: domElementIds.manageConvention.conventionValidationCancelButton,
    DEPRECATE:
      domElementIds.manageConvention.conventionValidationDeprecateButton,
    TRANSFER: domElementIds.manageConvention.edit.transferToAgencyButton,
  };

  const onActionButtonClick = () =>
    modalByAction(verificationAction).openModal();
  return {
    buttonProps: {
      id: actionButtonStatusId[verificationAction],
      children,
      iconId: selectedIcon ?? "fr-icon-checkbox-circle-line",
      priority:
        verificationAction === "REJECT" || verificationAction === "DEPRECATE"
          ? "secondary"
          : "primary",

      onClick: onActionButtonClick,
      disabled: disabled,
    },
    modalWrapperProps: {
      title: modalTitle,
      initialStatus: initialStatus,
      verificationAction: verificationAction,
      onSubmit: onSubmit,
      convention: convention,
      currentSignatoryRoles: currentSignatoryRoles,
      onCloseValidatorModalWithoutValidatorInfo:
        onCloseValidatorModalWithoutValidatorInfo,
    },
  };
};

export type ModalWrapperProps = {
  title: string;
  initialStatus: ConventionStatus;
  verificationAction: VerificationAction;
  onSubmit: VerificationActionButtonProps["onSubmit"];
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
};

export const ModalWrapper = (props: ModalWrapperProps) => {
  const {
    verificationAction,
    convention,
    initialStatus,
    currentSignatoryRoles,
    onSubmit,
    onCloseValidatorModalWithoutValidatorInfo,
  } = props;
  const modalObject = modalByAction(verificationAction);
  const { createModalParams } = modalObject;
  const isModalOpen = useIsModalOpen(createModalParams);
  const Modal = modalObject.modal;
  const [modalProps, setModalProps] = useState<ModalWrapperProps>(props);

  if (
    verificationAction !== "TRANSFER" &&
    !doesStatusNeedsJustification(
      newStatusByVerificationAction[verificationAction],
    ) &&
    !doesStatusNeedsValidators(
      initialStatus,
      newStatusByVerificationAction[verificationAction],
    )
  )
    return null;

  const { closeModal } = modalObject;
  const onModalPropsChange = (newProps: Partial<ModalWrapperProps>) => {
    setModalProps({
      ...modalProps,
      ...newProps,
    });
  };

  return createPortal(
    <Modal title={modalProps.title}>
      <Fragment
        key={`${modalObject.createModalParams.id}-${isModalOpen.toString()}`}
      >
        {verificationAction === "TRANSFER" && (
          <TransferConventionModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            convention={convention}
          />
        )}
        {doesStatusNeedsJustification(
          newStatusByVerificationAction[verificationAction],
        ) && (
          <JustificationModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            newStatus={newStatusByVerificationAction[verificationAction]}
            convention={convention}
            currentSignatoryRoles={currentSignatoryRoles}
            onModalPropsChange={onModalPropsChange}
          />
        )}
        {doesStatusNeedsValidators(
          initialStatus,
          newStatusByVerificationAction[verificationAction],
        ) && (
          <ValidatorModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            newStatus={newStatusByVerificationAction[verificationAction]}
            conventionId={convention.id}
            onCloseValidatorModalWithoutValidatorInfo={
              onCloseValidatorModalWithoutValidatorInfo
            }
          />
        )}
      </Fragment>
    </Modal>,
    document.body,
  );
};

const ValidatorModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
  conventionId,
  onCloseValidatorModalWithoutValidatorInfo,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: ConventionStatusWithValidator;
  conventionId: ConventionId;
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
}) => {
  const { register, handleSubmit } = useForm<WithValidatorInfo>({
    resolver: zodResolver(withValidatorInfoSchema),
    mode: "onTouched",
  });
  const onFormSubmit: SubmitHandler<WithValidatorInfo> = ({
    firstname,
    lastname,
  }) => {
    onSubmit({ status: newStatus, conventionId, firstname, lastname });
    closeModal();
  };
  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Input
          label={
            newStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Nom de la personne qui valide la demande *"
              : "Nom de la personne qui pré-valide la demande *"
          }
          nativeInputProps={{
            ...register("lastname"),
            required: true,
            id: domElementIds.manageConvention.validatorModalLastNameInput,
          }}
        />
        <Input
          label={
            newStatus === "ACCEPTED_BY_VALIDATOR"
              ? "Prénom de la personne qui valide la demande *"
              : "Prénom de la personne qui pré-valide la demande *"
          }
          nativeInputProps={{
            ...register("firstname"),
            required: true,
            id: domElementIds.manageConvention.validatorModalFirstNameInput,
          }}
        />
        <ButtonsGroup
          alignment="center"
          inlineLayoutWhen="always"
          buttons={[
            {
              type: "button",
              priority: "secondary",
              onClick: () => {
                if (onCloseValidatorModalWithoutValidatorInfo) {
                  onCloseValidatorModalWithoutValidatorInfo(
                    warningMessagesByConventionStatus[newStatus],
                  );
                }
                closeModal();
              },
              nativeButtonProps: {
                id: domElementIds.manageConvention.validatorModalCancelButton,
              },
              children: "Annuler et revenir en arrière",
            },
            {
              type: "submit",
              nativeButtonProps: {
                id: domElementIds.manageConvention.validatorModalSubmitButton,
              },
              children: "Terminer",
            },
          ]}
        />
      </form>
    </>
  );
};

const warningMessagesByConventionStatus: Record<
  ConventionStatusWithValidator,
  string
> = {
  ACCEPTED_BY_COUNSELLOR:
    'Vous n\'avez pas pré-validé la demande. Pour le faire, cliquez sur "Pré-valider la demande" puis sur "Terminer"',
  ACCEPTED_BY_VALIDATOR:
    'Vous n\'avez pas marqué la validation de la demande. Pour le faire, cliquez sur "Valider la demande" puis sur "Terminer la validation"',
};
