import React from "react";
import { createPortal } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConventionStatus,
  ConventionStatusWithJustification,
  doesStatusNeedsJustification,
  domElementIds,
  UpdateConventionStatusRequestDto,
  WithStatusJustification,
  withStatusJustificationSchema,
} from "shared";

export type VerificationActionButtonProps = {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  disabled?: boolean;
  newStatus: VerificationActions;
  children: string;
};

type VerificationActions = Exclude<
  ConventionStatus,
  "READY_TO_SIGN" | "PARTIALLY_SIGNED" | "IN_REVIEW"
>;

type VerificationActionsModal = Exclude<
  VerificationActions,
  "ACCEPTED_BY_COUNSELLOR" | "ACCEPTED_BY_VALIDATOR"
>;

const { RejectModal, openRejectModal, closeRejectModal } = createModal({
  name: "reject",
  isOpenedByDefault: false,
});

const { DraftModal, openDraftModal, closeDraftModal } = createModal({
  name: "draft",
  isOpenedByDefault: false,
});

const { CancelModal, openCancelModal, closeCancelModal } = createModal({
  name: "cancel",
  isOpenedByDefault: false,
});

const { DeprecateModal, openDeprecateModal, closeDeprecateModal } = createModal(
  {
    name: "deprecate",
    isOpenedByDefault: false,
  },
);

const ModalByStatus = (status: VerificationActionsModal) => {
  const modals = {
    DRAFT: {
      modal: DraftModal,
      openModal: openDraftModal,
      closeModal: closeDraftModal,
    },
    REJECTED: {
      modal: RejectModal,
      openModal: openRejectModal,
      closeModal: closeRejectModal,
    },
    CANCELLED: {
      modal: CancelModal,
      openModal: openCancelModal,
      closeModal: closeCancelModal,
    },
    DEPRECATED: {
      modal: DeprecateModal,
      openModal: openDeprecateModal,
      closeModal: closeDeprecateModal,
    },
  };
  return modals[status];
};

export const VerificationActionButton = ({
  newStatus,
  disabled,
  children,
  onSubmit,
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

  return (
    <>
      <Button
        iconId={selectedIcon ?? "fr-icon-checkbox-circle-line"}
        priority={newStatus === "REJECTED" ? "secondary" : "primary"}
        onClick={() => {
          doesStatusNeedsJustification(newStatus)
            ? ModalByStatus(newStatus).openModal()
            : onSubmit({ status: newStatus });
        }}
        className={fr.cx("fr-m-1w")}
        disabled={disabled}
        nativeButtonProps={{
          id: actionButtonStatusId[newStatus],
        }}
      >
        {children}
      </Button>
      {doesStatusNeedsJustification(newStatus) && (
        <ModalWrapper
          title={children}
          newStatus={newStatus}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
};

const ModalWrapper = ({
  title,
  newStatus,
  onSubmit,
}: {
  title: string;
  newStatus: VerificationActionsModal;
  onSubmit: VerificationActionButtonProps["onSubmit"];
}) => {
  if (!doesStatusNeedsJustification(newStatus)) return null;

  const Modal = ModalByStatus(newStatus).modal;
  const closeModal = ModalByStatus(newStatus).closeModal;

  return createPortal(
    <Modal title={title}>
      <>
        <JustificationModalContent
          onSubmit={onSubmit}
          closeModal={closeModal}
          newStatus={newStatus}
        />
      </>
    </Modal>,
    document.body,
  );
};

const JustificationModalContent = ({
  onSubmit,
  closeModal,
  newStatus,
}: {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  closeModal: () => void;
  newStatus: VerificationActions;
}) => {
  const { register, handleSubmit } = useForm<WithStatusJustification>({
    resolver: zodResolver(withStatusJustificationSchema),
    mode: "onTouched",
    defaultValues: { statusJustification: "" },
  });
  const onFormSubmit: SubmitHandler<WithStatusJustification> = (values) => {
    onSubmit({ ...values, status: newStatus });
    closeModal();
  };

  return (
    <>
      {newStatus === "DRAFT" && (
        <>
          <Alert
            severity="warning"
            title="Attention !"
            className={fr.cx("fr-mb-2w")}
            description="Ne surtout pas demander de modification pour relancer un signataire manquant. 
            Cela revient à annuler les signatures déjà enregistrées. 
            Si vous souhaitez le relancer, contactez-le directement par e-mail ou par téléphone."
          />
          <Alert
            severity="warning"
            title="Attention !"
            className={fr.cx("fr-mb-2w")}
            description="Vous seul allez recevoir par e-mail le lien pour modifier cette demande (peut-être dans une boite générique agence)."
          />
        </>
      )}
      {newStatus === "REJECTED" && (
        <Alert
          severity="warning"
          title="Attention !"
          className={fr.cx("fr-mb-2w")}
          description="Ne surtout pas refuser une immersion si une signature manque ! Cela
  revient à annuler les signatures déjà enregistrées. Pour relancer un
  signataire manquant, le contacter par mail."
        />
      )}
      {newStatus === "CANCELLED" && (
        <Alert
          severity="warning"
          title="Attention ! Cette opération est irréversible !"
          className={fr.cx("fr-mb-2w")}
          description="Vous souhaitez annuler une convention qui a déjà été validée. Veuillez indiquer votre nom et prénom afin de garantir un suivi des annulations de convention."
        />
      )}
      {doesStatusNeedsJustification(newStatus) && (
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Input
            textArea
            label={inputLabelByStatus[newStatus]}
            nativeTextAreaProps={{
              ...register("statusJustification"),
            }}
          />
          <ButtonsGroup
            alignment="center"
            inlineLayoutWhen="always"
            buttons={[
              {
                type: "button",
                priority: "secondary",
                onClick: closeModal,
                nativeButtonProps: {
                  id: domElementIds.manageConvention
                    .justificationModalCancelButton,
                },
                children: "Annuler",
              },
              {
                type: "submit",
                nativeButtonProps: {
                  id: domElementIds.manageConvention
                    .justificationModalSubmitButton,
                },
                children: confirmByStatus[newStatus],
              },
            ]}
          />
        </form>
      )}
    </>
  );
};

const inputLabelByStatus: Record<ConventionStatusWithJustification, string> = {
  DRAFT: "Précisez la raison et la modification nécessaire",
  REJECTED: "Pourquoi l'immersion est-elle refusée ?",
  CANCELLED: "Pourquoi souhaitez-vous annuler cette convention?",
  DEPRECATED: "Pourquoi l'immersion est-elle obsolète",
};

const confirmByStatus: Record<ConventionStatusWithJustification, string> = {
  DRAFT: "Confirmer la demande de modification",
  REJECTED: "Confirmer le refus",
  CANCELLED: "Confirmer l'annulation",
  DEPRECATED: "Confirmer que la demande est obsolète",
};
