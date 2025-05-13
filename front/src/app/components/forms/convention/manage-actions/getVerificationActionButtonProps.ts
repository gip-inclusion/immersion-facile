import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type { Dispatch, SetStateAction } from "react";
import type {
  ConventionDto,
  ConventionStatus,
  RenewConventionParams,
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
      | TransferConventionToAgencyRequestDto
      | RenewConventionParams,
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

const allVerificationActions = [
  "ACCEPT_COUNSELLOR",
  "ACCEPT_VALIDATOR",
  "REJECT",
  "CANCEL",
  "DEPRECATE",
  "TRANSFER",
  "RENEW",
] as const;
export type VerificationAction = (typeof allVerificationActions)[number];

export const newStatusByVerificationAction = {
  ACCEPT_COUNSELLOR: "ACCEPTED_BY_COUNSELLOR",
  ACCEPT_VALIDATOR: "ACCEPTED_BY_VALIDATOR",
  REJECT: "REJECTED",
  CANCEL: "CANCELLED",
  DEPRECATE: "DEPRECATED",
} satisfies Record<
  Exclude<VerificationAction, "TRANSFER" | "RENEW">,
  ConventionStatus
>;

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
      verificationAction === "REJECT" ||
      verificationAction === "DEPRECATE" ||
      verificationAction === "RENEW"
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
