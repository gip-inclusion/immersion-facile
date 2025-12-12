import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { type Dispatch, Fragment, type SetStateAction, useState } from "react";
import { createPortal } from "react-dom";
import {
  type ConnectedUser,
  type ConventionDto,
  type ConventionStatus,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
  type EditConventionCounsellorNameRequestDto,
  type MarkPartnersErroredConventionAsHandledRequest,
  type RenewConventionParams,
  type Role,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  type WithConventionId,
} from "shared";
import {
  newStatusByVerificationAction,
  type VerificationActionWithModal,
} from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { modalByAction } from "src/app/components/forms/convention/manage-actions/manageActionModals";
import { BroadcastAgainModalContent } from "src/app/components/forms/convention/manage-actions/modals/BroadcastAgainModalContent";
import { EditCounsellorNameModalContent } from "src/app/components/forms/convention/manage-actions/modals/EditCounsellorNameModalContent";
import { JustificationModalContent } from "src/app/components/forms/convention/manage-actions/modals/JustificationModalContent";
import { MarkConventionAsHandledModalContent } from "src/app/components/forms/convention/manage-actions/modals/MarkConventionAsHandledModalContent";
import { RenewConventionModalContent } from "src/app/components/forms/convention/manage-actions/modals/RenewConventionModalContent";
import { SignConventionModalContent } from "src/app/components/forms/convention/manage-actions/modals/SignConventionModalContent";
import { TransferModalContent } from "src/app/components/forms/convention/manage-actions/modals/TransferModalContent";
import { ValidatorModalContent } from "src/app/components/forms/convention/manage-actions/modals/ValidatorModalContent";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { match, P } from "ts-pattern";

export type ModalWrapperProps = {
  title: string;
  initialStatus: ConventionStatus;
  verificationAction: VerificationActionWithModal;
  onSubmit: (
    verificationAction: VerificationActionWithModal,
    params:
      | UpdateConventionStatusRequestDto
      | TransferConventionToAgencyRequestDto
      | RenewConventionParams
      | EditConventionCounsellorNameRequestDto
      | WithConventionId
      | MarkPartnersErroredConventionAsHandledRequest,
  ) => void;
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
  currentUser?: ConnectedUser;
};

export const ModalWrapper = (props: ModalWrapperProps) => {
  const {
    verificationAction,
    convention,
    initialStatus,
    currentSignatoryRoles,
    onSubmit,
    onCloseValidatorModalWithoutValidatorInfo,
    currentUser,
  } = props;
  const modalObject = modalByAction(verificationAction);
  const { createModalParams } = modalObject;
  const isModalOpen = useIsModalOpen(createModalParams);
  const [modalProps, setModalProps] = useState<ModalWrapperProps>(props);
  const renewFeedback = useFeedbackTopic("convention-action-renew");
  const showTransferModal = verificationAction === "TRANSFER";
  const showEditCounsellorNameModal =
    verificationAction === "EDIT_COUNSELLOR_NAME";
  const showRenewModal =
    verificationAction === "RENEW" && renewFeedback?.level !== "success";
  const showBroadcastAgainModal = verificationAction === "BROADCAST_AGAIN";
  const showMarkAsHandledModal =
    verificationAction === "MARK_AS_HANDLED" && !!currentUser;
  const showFillAssessmentInfoModal =
    verificationAction === "FILL_ASSESSMENT_INFO";
  const showSignModal = verificationAction === "SIGN";
  const showJustificationModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    verificationAction !== "EDIT_COUNSELLOR_NAME" &&
    verificationAction !== "BROADCAST_AGAIN" &&
    verificationAction !== "MARK_AS_HANDLED" &&
    verificationAction !== "FILL_ASSESSMENT_INFO" &&
    verificationAction !== "SIGN" &&
    doesStatusNeedsJustification(
      newStatusByVerificationAction[verificationAction],
    );
  const showValidatorModal =
    verificationAction !== "TRANSFER" &&
    verificationAction !== "RENEW" &&
    verificationAction !== "EDIT_COUNSELLOR_NAME" &&
    verificationAction !== "BROADCAST_AGAIN" &&
    verificationAction !== "MARK_AS_HANDLED" &&
    verificationAction !== "FILL_ASSESSMENT_INFO" &&
    verificationAction !== "SIGN" &&
    doesStatusNeedsValidators(
      initialStatus,
      newStatusByVerificationAction[verificationAction],
    );

  if (
    !showTransferModal &&
    !showJustificationModal &&
    !showValidatorModal &&
    !showRenewModal &&
    !showEditCounsellorNameModal &&
    !showBroadcastAgainModal &&
    !showMarkAsHandledModal &&
    !showFillAssessmentInfoModal &&
    !showSignModal
  )
    return null;

  const { closeModal } = modalObject;
  const onModalPropsChange = (newProps: Partial<ModalWrapperProps>) => {
    setModalProps({
      ...modalProps,
      ...newProps,
    });
  };

  const modalContent = (
    <Fragment
      key={`${modalObject.createModalParams.id}-${isModalOpen.toString()}`}
    >
      {match({
        showTransferModal,
        showJustificationModal,
        showValidatorModal,
        showRenewModal,
        showEditCounsellorNameModal,
        showBroadcastAgainModal,
        showMarkAsHandledModal,
        showFillAssessmentInfoModal,
        showSignModal,
        currentUser,
        newStatus:
          verificationAction === "TRANSFER" ||
          verificationAction === "RENEW" ||
          verificationAction === "EDIT_COUNSELLOR_NAME" ||
          verificationAction === "BROADCAST_AGAIN" ||
          verificationAction === "MARK_AS_HANDLED" ||
          verificationAction === "FILL_ASSESSMENT_INFO" ||
          verificationAction === "SIGN"
            ? null
            : newStatusByVerificationAction[verificationAction],
      })
        .with(
          {
            showEditCounsellorNameModal: true,
          },
          () => (
            <EditCounsellorNameModalContent
              onSubmit={(params) => onSubmit(verificationAction, params)}
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
              onSubmit={(params) => onSubmit(verificationAction, params)}
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
              formId={
                modalObject.type === "form" ? modalObject.formId : undefined
              }
              onSubmit={(params) => onSubmit(verificationAction, params)}
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
              onSubmit={(params) => onSubmit(verificationAction, params)}
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
              onSubmit={(params) => onSubmit(verificationAction, params)}
              closeModal={closeModal}
              convention={convention}
            />
          ),
        )
        .with(
          {
            showBroadcastAgainModal: true,
            showTransferModal: false,
            showJustificationModal: false,
            showValidatorModal: false,
            showRenewModal: false,
            showEditCounsellorNameModal: false,
            showMarkAsHandledModal: false,
          },
          () => (
            <BroadcastAgainModalContent
              conventionId={convention.id}
              closeModal={closeModal}
              onSubmit={(params) => onSubmit(verificationAction, params)}
            />
          ),
        )
        .with(
          {
            showMarkAsHandledModal: true,
            showTransferModal: false,
            showJustificationModal: false,
            showValidatorModal: false,
            showRenewModal: false,
            showEditCounsellorNameModal: false,
            showBroadcastAgainModal: false,
            currentUser: P.not(P.nullish),
          },
          ({ currentUser }) => (
            <MarkConventionAsHandledModalContent
              conventionId={convention.id}
              currentUser={currentUser}
              closeModal={closeModal}
              onSubmit={(params) => onSubmit(verificationAction, params)}
            />
          ),
        )
        .with(
          {
            showFillAssessmentInfoModal: true,
            showTransferModal: false,
            showJustificationModal: false,
            showValidatorModal: false,
            showRenewModal: false,
            showEditCounsellorNameModal: false,
            showBroadcastAgainModal: false,
            showMarkAsHandledModal: false,
            showSignModal: false,
          },
          () => (
            <p>
              Seule la personne désignée comme tuteur ou tutrice dans la
              convention peut remplir le bilan d'immersion. N'hésitez pas à
              transmettre l'information au bon interlocuteur.
            </p>
          ),
        )
        .with(
          {
            showSignModal: true,
            showTransferModal: false,
            showJustificationModal: false,
            showValidatorModal: false,
            showRenewModal: false,
            showEditCounsellorNameModal: false,
            showBroadcastAgainModal: false,
            showMarkAsHandledModal: false,
            showFillAssessmentInfoModal: false,
          },
          () => {
            return (
              <SignConventionModalContent
                signatory={
                  props.convention.signatories.establishmentRepresentative
                }
                internshipKind={props.convention.internshipKind}
                onCancel={() => {}}
              />
            );
          },
        )
        .otherwise(() => null)}
    </Fragment>
  );

  if (modalObject.type === "form") {
    const FormModal = modalObject.modal;
    return createPortal(
      <FormModal
        title={modalProps.title}
        doSubmitClosesModal={false}
        formId={modalObject.formId}
      >
        {modalContent}
      </FormModal>,
      document.body,
    );
  }

  const RegularModal = modalObject.modal;
  return createPortal(
    <RegularModal title={modalProps.title} buttons={modalObject.buttons}>
      {modalContent}
    </RegularModal>,

    document.body,
  );
};
