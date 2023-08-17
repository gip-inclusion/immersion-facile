import React, { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ConventionStatusWithValidator,
  doesStatusNeedsJustification,
  doesStatusNeedsValidators,
  domElementIds,
  Role,
  UpdateConventionStatusRequestDto,
} from "shared";
import { JustificationModalContent } from "./JustificationModalContent";

type WithValidatorInfo = { firstname?: string; lastname?: string };
const withValidatorInfoSchema: z.Schema<WithValidatorInfo> = z.object({
  firstname: z.string().trim().optional(),
  lastname: z.string().trim().optional(),
});

export type VerificationActionButtonProps = {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  disabled?: boolean;
  initialStatus: ConventionStatus;
  newStatus: VerificationActions;
  children: string;
  convention: ConventionDto;
  currentSignatoryRole: Role;
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
};

export type VerificationActions = Exclude<
  ConventionStatus,
  "READY_TO_SIGN" | "PARTIALLY_SIGNED" | "IN_REVIEW"
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

const {
  Component: ValidatorModal,
  open: openValidatorModal,
  close: closeValidatorModal,
} = createModal({
  id: "validator",
  isOpenedByDefault: false,
});

const ModalByStatus = (status: VerificationActions) => {
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
    ACCEPTED_BY_COUNSELLOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
    },
    ACCEPTED_BY_VALIDATOR: {
      modal: ValidatorModal,
      openModal: openValidatorModal,
      closeModal: closeValidatorModal,
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
  initialStatus,
  onCloseValidatorModalWithoutValidatorInfo,
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
  const onActionButtonClick = () =>
    doesStatusNeedsJustification(newStatus) ||
    doesStatusNeedsValidators(initialStatus, newStatus)
      ? ModalByStatus(newStatus).openModal()
      : onSubmit({ status: newStatus, conventionId });

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
          title={children}
          initialStatus={initialStatus}
          newStatus={newStatus}
          onSubmit={onSubmit}
          convention={convention}
          currentSignatoryRole={currentSignatoryRole}
          onCloseValidatorModalWithoutValidatorInfo={
            onCloseValidatorModalWithoutValidatorInfo
          }
        />
      )}
    </>
  );
};

const ModalWrapper = ({
  title,
  initialStatus,
  newStatus,
  onSubmit,
  convention,
  currentSignatoryRole,
  onCloseValidatorModalWithoutValidatorInfo,
}: {
  title: string;
  initialStatus: ConventionStatus;
  newStatus: VerificationActions;
  onSubmit: VerificationActionButtonProps["onSubmit"];
  convention: ConventionDto;
  currentSignatoryRole: Role;
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
}) => {
  if (
    !doesStatusNeedsJustification(newStatus) &&
    !doesStatusNeedsValidators(initialStatus, newStatus)
  )
    return null;

  const Modal = ModalByStatus(newStatus).modal;
  const closeModal = ModalByStatus(newStatus).closeModal;

  return createPortal(
    <Modal title={title}>
      <>
        {doesStatusNeedsJustification(newStatus) && (
          <JustificationModalContent
            onSubmit={onSubmit}
            closeModal={closeModal}
            newStatus={newStatus}
            convention={convention}
            currentSignatoryRole={currentSignatoryRole}
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
      </>
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
          label={"Nom du conseiller qui marque la demande (facultatif)"}
          nativeInputProps={{
            ...register("lastname"),
          }}
        />
        <Input
          label={"Prénom du conseiller qui marque la demande (facultatif)"}
          nativeInputProps={{
            ...register("firstname"),
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
    'Vous n\'avez pas marqué la demande comme éligible. Pour le faire, cliquez sur "Marquer la demande comme éligible" puis sur "Terminer"',
  ACCEPTED_BY_VALIDATOR:
    'Vous n\'avez pas marqué la validation de la demande. Pour le faire, cliquez sur "Valider la demande" puis sur "Terminer la validation"',
};
