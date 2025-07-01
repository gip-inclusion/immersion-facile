import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { type Dispatch, Fragment, type SetStateAction, useState } from "react";
import { createPortal } from "react-dom";
import {
  type ConventionDto,
  type ConventionStatus,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
  type Role,
} from "shared";
import {
  newStatusByVerificationAction,
  type VerificationAction,
  type VerificationActionProps,
} from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { modalByAction } from "src/app/components/forms/convention/manage-actions/manageActionModals";
import { EditCounsellorNameModalContent } from "src/app/components/forms/convention/manage-actions/modals/EditCounsellorNameModalContent";
import { JustificationModalContent } from "src/app/components/forms/convention/manage-actions/modals/JustificationModalContent";
import { RenewConventionModalContent } from "src/app/components/forms/convention/manage-actions/modals/RenewConventionModalContent";
import { TransferModalContent } from "src/app/components/forms/convention/manage-actions/modals/TransferModalContent";
import { ValidatorModalContent } from "src/app/components/forms/convention/manage-actions/modals/ValidatorModalContent";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { match, P } from "ts-pattern";

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
  const renewFeedback = useFeedbackTopic("convention-action-renew");
  const showTransferModal = verificationAction === "TRANSFER";
  const showEditCounsellorNameModal =
    verificationAction === "EDIT_COUNSELLOR_NAME";
  const showRenewModal =
    verificationAction === "RENEW" && renewFeedback?.level !== "success";
  const showJustificationModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    verificationAction !== "EDIT_COUNSELLOR_NAME" &&
    doesStatusNeedsJustification(
      newStatusByVerificationAction[verificationAction],
    );
  const showValidatorModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    verificationAction !== "EDIT_COUNSELLOR_NAME" &&
    doesStatusNeedsValidators(
      initialStatus,
      newStatusByVerificationAction[verificationAction],
    );

  if (
    !showTransferModal &&
    !showJustificationModal &&
    !showValidatorModal &&
    !showRenewModal &&
    !showEditCounsellorNameModal
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
        {match({
          showTransferModal,
          showJustificationModal,
          showValidatorModal,
          showRenewModal,
          showEditCounsellorNameModal,
          newStatus:
            verificationAction === "TRANSFER" ||
            verificationAction === "RENEW" ||
            verificationAction === "EDIT_COUNSELLOR_NAME"
              ? null
              : newStatusByVerificationAction[verificationAction],
        })
          .with(
            {
              showEditCounsellorNameModal: true,
            },
            () => (
              <EditCounsellorNameModalContent
                onSubmit={onSubmit}
                closeModal={closeModal}
                conventionId={convention.id}
              />
            ),
          )
          .with(
            {
              showTransferModal: true,
              showJustificationModal: false,
              showValidatorModal: false,
              showRenewModal: false,
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
              showRenewModal: false,
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
              showRenewModal: false,
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
          .with(
            {
              showRenewModal: true,
              showTransferModal: false,
              showJustificationModal: false,
              showValidatorModal: false,
            },
            () => (
              <RenewConventionModalContent
                onSubmit={onSubmit}
                closeModal={closeModal}
                convention={convention}
              />
            ),
          )
          .otherwise(() => null)}
      </Fragment>
    </Modal>,
    document.body,
  );
};
