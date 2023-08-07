import React from "react";
import { createPortal } from "react-dom";
// import { SubmitHandler, useForm } from "react-hook-form";
import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";
// import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
// import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
// import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
// import Select from "@codegouvfr/react-dsfr/SelectNext";
// import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConventionDto,
  ConventionStatus,
  // ConventionStatusWithJustification,
  doesStatusNeedsJustification,
  domElementIds,
  Role,
  // Signatories,
  // SignatoryRole,
  UpdateConventionStatusRequestDto,
  // updateConventionStatusRequestSchema,
} from "shared";
import { JustificationModalContent } from "./justificationModaleContent";

export type VerificationActionButtonProps = {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  disabled?: boolean;
  newStatus: VerificationActions;
  children: string;
  convention: ConventionDto;
  currentSignatoryRole: Role;
};

export type VerificationActions = Exclude<
  ConventionStatus,
  "READY_TO_SIGN" | "PARTIALLY_SIGNED" | "IN_REVIEW"
>;

type VerificationActionsModal = Exclude<
  VerificationActions,
  "ACCEPTED_BY_COUNSELLOR" | "ACCEPTED_BY_VALIDATOR"
>;

const {
  Component: RejectModal,
  open: openRejectModal,
  close: closeRejectModal,
} = createModal({
  id: "reject",
  isOpenedByDefault: false,
});

const {
  Component: DraftModal,
  open: openDraftModal,
  close: closeDraftModal,
} = createModal({
  id: "draft",
  isOpenedByDefault: false,
});

const {
  Component: CancelModal,
  open: openCancelModal,
  close: closeCancelModal,
} = createModal({
  id: "cancel",
  isOpenedByDefault: false,
});

const {
  Component: DeprecateModal,
  open: openDeprecateModal,
  close: closeDeprecateModal,
} = createModal({
  id: "deprecate",
  isOpenedByDefault: false,
});

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
  convention,
  currentSignatoryRole,
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

  const conventionId = convention.id;

  return (
    <>
      <Button
        iconId={selectedIcon ?? "fr-icon-checkbox-circle-line"}
        priority={
          newStatus === "REJECTED" || newStatus === "DEPRECATED"
            ? "secondary"
            : "primary"
        }
        onClick={() => {
          doesStatusNeedsJustification(newStatus)
            ? ModalByStatus(newStatus).openModal()
            : onSubmit({ status: newStatus, conventionId });
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
          convention={convention}
          currentSignatoryRole={currentSignatoryRole}
        />
      )}
    </>
  );
};

const ModalWrapper = ({
  title,
  newStatus,
  onSubmit,
  convention,
  currentSignatoryRole,
}: {
  title: string;
  newStatus: VerificationActionsModal;
  onSubmit: VerificationActionButtonProps["onSubmit"];
  convention: ConventionDto;
  currentSignatoryRole: Role;
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
          convention={convention}
          currentSignatoryRole={currentSignatoryRole}
        />
      </>
    </Modal>,
    document.body,
  );
};
