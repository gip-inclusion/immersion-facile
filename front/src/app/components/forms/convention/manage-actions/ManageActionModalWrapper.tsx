import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { type Dispatch, Fragment, type SetStateAction, useState } from "react";
import { createPortal } from "react-dom";
import {
  type ConventionDto,
  type ConventionStatus,
  type Role,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
} from "shared";
import {
  type VerificationAction,
  type VerificationActionProps,
  newStatusByVerificationAction,
} from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { modalByAction } from "src/app/components/forms/convention/manage-actions/manageActionModals";
import { JustificationModalContent } from "src/app/components/forms/convention/manage-actions/modals/JustificationModalContent";
import { TransferModalContent } from "src/app/components/forms/convention/manage-actions/modals/TransferModalContent";
import { ValidatorModalContent } from "src/app/components/forms/convention/manage-actions/modals/ValidatorModalContent";
import { P, match } from "ts-pattern";

export type ModalWrapperProps = {
  title: string;
  initialStatus: ConventionStatus;
  verificationAction: VerificationAction;
  onSubmit: VerificationActionProps["onSubmit"];
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
  const showTransferModal = verificationAction === "TRANSFER";
  const showJustificationModal = doesStatusNeedsJustification(
    newStatusByVerificationAction[verificationAction],
  );
  const showValidatorModal = doesStatusNeedsValidators(
    initialStatus,
    newStatusByVerificationAction[verificationAction],
  );

  if (!showTransferModal && !showJustificationModal && !showValidatorModal)
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
        {match({
          showTransferModal,
          showJustificationModal,
          showValidatorModal,
          newStatus: newStatusByVerificationAction[verificationAction],
        })
          .with(
            {
              showTransferModal: true,
              showJustificationModal: false,
              showValidatorModal: false,
            },
            () => (
              <TransferModalContent
                onSubmit={onSubmit}
                closeModal={closeModal}
                convention={convention}
              />
            ),
          )
          .with(
            {
              showTransferModal: false,
              showJustificationModal: true,
              showValidatorModal: false,
              newStatus: P.union(...conventionStatusesWithJustification),
            },
            ({ newStatus }) => (
              <JustificationModalContent
                onSubmit={onSubmit}
                closeModal={closeModal}
                newStatus={newStatus}
                convention={convention}
                currentSignatoryRoles={currentSignatoryRoles}
                onModalPropsChange={onModalPropsChange}
              />
            ),
          )
          .with(
            {
              showTransferModal: false,
              showJustificationModal: false,
              showValidatorModal: true,
              newStatus: P.union(...conventionStatusesWithValidator),
            },
            ({ newStatus }) => (
              <ValidatorModalContent
                onSubmit={onSubmit}
                closeModal={closeModal}
                newStatus={newStatus}
                conventionId={convention.id}
                onCloseValidatorModalWithoutValidatorInfo={
                  onCloseValidatorModalWithoutValidatorInfo
                }
              />
            ),
          )
          .otherwise(() => null)}
      </Fragment>
    </Modal>,
    document.body,
  );
};
