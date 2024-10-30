import { FrIconClassName, fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";
import { createPortal } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ConventionStatusWithValidator,
  Role,
  UpdateConventionStatusRequestDto,
  WithValidatorInfo,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
  domElementIds,
  withValidatorInfoSchema,
} from "shared";
import { JustificationModalContent } from "./JustificationModalContent";

export type VerificationActionButtonProps = {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  disabled?: boolean;
  initialStatus: ConventionStatus;
  newStatus: VerificationActions;
  children: string;
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
  modalTitle: string;
};

export type VerificationActions = Exclude<
  ConventionStatus,
  "READY_TO_SIGN" | "PARTIALLY_SIGNED" | "IN_REVIEW"
>;

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

const modalByStatus = (status: VerificationActions) => {
  const modals = {
    DRAFT: {
      modal: DraftModal,
      openModal: openDraftModal,
      closeModal: closeDraftModal,
      createModalParams: createDraftModalParams,
    },
    REJECTED: {
      modal: RejectModal,
      openModal: openRejectModal,
      closeModal: closeRejectModal,
      createModalParams: createRejectModalParams,
    },
    CANCELLED: {
      modal: CancelModal,
      openModal: openCancelModal,
      closeModal: closeCancelModal,
      createModalParams: createCancelModalParams,
    },
    DEPRECATED: {
      modal: DeprecateModal,
      openModal: openDeprecateModal,
      closeModal: closeDeprecateModal,
      createModalParams: createDeprecatedModalParams,
    },
    ACCEPTED_BY_COUNSELLOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
      createModalParams: createValidatorModalParams,
    },
    ACCEPTED_BY_VALIDATOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
      createModalParams: createValidatorModalParams,
    },
  };
  return modals[status];
};

export const VerificationActionButton = ({
  newStatus,
  disabled,
  children,
  onSubmit,
  convention,
  currentSignatoryRoles,
  initialStatus,
  onCloseValidatorModalWithoutValidatorInfo,
  modalTitle,
}: VerificationActionButtonProps) => {
  const iconByStatus: Partial<Record<ConventionStatus, FrIconClassName>> = {
    REJECTED: "fr-icon-close-circle-line",
    DRAFT: "fr-icon-edit-line",
    CANCELLED: "fr-icon-delete-bin-line",
  };
  const selectedIcon = iconByStatus[newStatus];
  const actionButtonStatusId: Record<VerificationActions, string> = {
    DRAFT: domElementIds.manageConvention.conventionValidationRequestEditButton,
    REJECTED: domElementIds.manageConvention.conventionValidationRejectButton,
    ACCEPTED_BY_VALIDATOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    ACCEPTED_BY_COUNSELLOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    CANCELLED: domElementIds.manageConvention.conventionValidationCancelButton,
    DEPRECATED:
      domElementIds.manageConvention.conventionValidationDeprecateButton,
  };

  const onActionButtonClick = () => modalByStatus(newStatus).openModal();

  return (
    <>
      <Button
        iconId={selectedIcon ?? "fr-icon-checkbox-circle-line"}
        priority={
          newStatus === "REJECTED" || newStatus === "DEPRECATED"
            ? "secondary"
            : "primary"
        }
        onClick={onActionButtonClick}
        className={fr.cx("fr-m-1w")}
        disabled={disabled}
        nativeButtonProps={{
          id: actionButtonStatusId[newStatus],
        }}
      >
        {children}
      </Button>
      {(doesStatusNeedsJustification(newStatus) ||
        doesStatusNeedsValidators(initialStatus, newStatus)) && (
        <ModalWrapper
          title={modalTitle}
          initialStatus={initialStatus}
          newStatus={newStatus}
          onSubmit={onSubmit}
          convention={convention}
          currentSignatoryRoles={currentSignatoryRoles}
          onCloseValidatorModalWithoutValidatorInfo={
            onCloseValidatorModalWithoutValidatorInfo
          }
        />
      )}
    </>
  );
};

export type ModalWrapperProps = {
  title: string;
  initialStatus: ConventionStatus;
  newStatus: VerificationActions;
  onSubmit: VerificationActionButtonProps["onSubmit"];
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
};

const ModalWrapper = (props: ModalWrapperProps) => {
  const {
    newStatus,
    convention,
    initialStatus,
    currentSignatoryRoles,
    onSubmit,
    onCloseValidatorModalWithoutValidatorInfo,
  } = props;
  const modalObject = modalByStatus(newStatus);
  const { createModalParams } = modalObject;
  const isModalOpen = useIsModalOpen(createModalParams);
  const Modal = modalObject.modal;
  const [modalProps, setModalProps] = useState<ModalWrapperProps>(props);

  if (
    !doesStatusNeedsJustification(newStatus) &&
    !doesStatusNeedsValidators(initialStatus, newStatus)
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
        {doesStatusNeedsJustification(newStatus) && (
          <JustificationModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            newStatus={newStatus}
            convention={convention}
            currentSignatoryRoles={currentSignatoryRoles}
            onModalPropsChange={onModalPropsChange}
          />
        )}
        {!doesStatusNeedsJustification(newStatus) && (
          <ValidatorModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            newStatus={newStatus}
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
