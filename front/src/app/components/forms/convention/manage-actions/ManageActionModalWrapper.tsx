import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import {
  type Dispatch,
  type ForwardedRef,
  Fragment,
  type SetStateAction,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { SubmitHandler, UseFormHandleSubmit } from "react-hook-form";
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
import { RenewConventionModalContent } from "src/app/components/forms/convention/manage-actions/modals/RenewConventionModalContent";
import { TransferModalContent } from "src/app/components/forms/convention/manage-actions/modals/TransferModalContent";
import { ValidatorModalContent } from "src/app/components/forms/convention/manage-actions/modals/ValidatorModalContent";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
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

export type ModalContentRef = {
  submitForm: () => void;
  submitButtonLabel: string;
  cancelButtonLabel: string;
  submitButtonId: string;
  cancelButtonId: string;
};

export const useExposeFormModalContentRef = <T extends object>(
  ref: ForwardedRef<ModalContentRef>,
  {
    handleSubmit,
    onFormSubmit,
    submitButtonLabel,
    cancelButtonLabel,
    submitButtonId,
    cancelButtonId,
  }: {
    handleSubmit: UseFormHandleSubmit<T>;
    onFormSubmit: SubmitHandler<T>;
    submitButtonLabel: string;
    cancelButtonLabel: string;
    submitButtonId: string;
    cancelButtonId: string;
  },
) => {
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(onFormSubmit)();
    },
    submitButtonLabel,
    cancelButtonLabel,
    submitButtonId,
    cancelButtonId,
  }));
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
  const showRenewModal =
    verificationAction === "RENEW" && renewFeedback?.level !== "success";
  const showJustificationModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    doesStatusNeedsJustification(
      newStatusByVerificationAction[verificationAction],
    );
  const showValidatorModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    doesStatusNeedsValidators(
      initialStatus,
      newStatusByVerificationAction[verificationAction],
    );

  if (
    !showTransferModal &&
    !showJustificationModal &&
    !showValidatorModal &&
    !showRenewModal
  )
    return null;

  const { closeModal } = modalObject;
  const onModalPropsChange = (newProps: Partial<ModalWrapperProps>) => {
    setModalProps({
      ...modalProps,
      ...newProps,
    });
  };

  const modalContentRef = useRef<ModalContentRef>(null);
  const modal = modalContentRef.current;
  return createPortal(
    <Modal
      title={modalProps.title}
      buttons={[
        {
          type: "button",
          priority: "secondary",
          onClick: closeModal,
          children: modal?.cancelButtonLabel,
          id: modal?.cancelButtonId,
        },
        {
          type: "submit",
          priority: "primary",
          onClick: modal?.submitForm,
          children: modal?.submitButtonLabel,
          id: modal?.submitButtonId,
        },
      ]}
    >
      <Fragment
        key={`${modalObject.createModalParams.id}-${isModalOpen.toString()}`}
      >
        {match({
          showTransferModal,
          showJustificationModal,
          showValidatorModal,
          showRenewModal,
          newStatus:
            verificationAction === "TRANSFER" || verificationAction === "RENEW"
              ? null
              : newStatusByVerificationAction[verificationAction],
        })
          .with(
            {
              showTransferModal: true,
              showJustificationModal: false,
              showValidatorModal: false,
              showRenewModal: false,
            },
            () => (
              <TransferModalContent
                ref={modalContentRef}
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
                ref={modalContentRef}
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
                ref={modalContentRef}
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
