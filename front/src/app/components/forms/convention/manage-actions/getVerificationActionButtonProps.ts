import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type { Dispatch, SetStateAction } from "react";
import type {
  ConventionDto,
  ConventionStatus,
  Role,
  TransferConventionToAgencyRequestDto,
  UpdateConventionStatusRequestDto,
} from "shared";
import type { ModalWrapperProps } from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { modalByAction } from "src/app/components/forms/convention/manage-actions/manageActionModals";

export type VerificationActionProps = {
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

export const newStatusByVerificationAction = {
  ACCEPT_COUNSELLOR: "ACCEPTED_BY_COUNSELLOR",
  ACCEPT_VALIDATOR: "ACCEPTED_BY_VALIDATOR",
  REQUEST_EDIT: "DRAFT",
  REJECT: "REJECTED",
  CANCEL: "CANCELLED",
  DEPRECATE: "DEPRECATED",
  TRANSFER: null,
} satisfies Record<string, ConventionStatus | null>;

export type VerificationAction = keyof typeof newStatusByVerificationAction;


export const getVerificationActionProps = ({
  verificationAction,
  disabled,
  children,
  onSubmit,
  convention,
  currentSignatoryRoles,
  initialStatus,
  onCloseValidatorModalWithoutValidatorInfo,
  modalTitle,
}: VerificationActionProps): {
  buttonProps: ButtonProps & { children: string };
  modalWrapperProps: ModalWrapperProps;
} => ({
  buttonProps: {
    children,
    priority:
      verificationAction === "REJECT" || verificationAction === "DEPRECATE"
        ? "secondary"
        : "primary",

    onClick: () => modalByAction(verificationAction).openModal(),
    disabled,
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
});
