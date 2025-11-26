import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type {
  FrIconClassName,
  RiIconClassName,
} from "@codegouvfr/react-dsfr/fr/generatedFromCss/classNames";
import type { Dispatch, SetStateAction } from "react";
import type {
  ConventionDto,
  ConventionReadDto,
  ConventionStatus,
  EditConventionCounsellorNameRequestDto,
  MarkPartnersErroredConventionAsHandledRequest,
  RenewConventionParams,
  Role,
  TransferConventionToAgencyRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import type { ModalWrapperProps } from "src/app/components/forms/convention/manage-actions/ManageActionModalWrapper";
import { linkByAction } from "src/app/components/forms/convention/manage-actions/manageActionLinks";
import { modalByAction } from "src/app/components/forms/convention/manage-actions/manageActionModals";
import type { Link } from "type-route";

type BaseVerificationActionParams = {
  children: string;
  buttonId: string;
  iconId?: FrIconClassName | RiIconClassName;
  iconPosition?: "left" | "right";
  disabled?: boolean;
};

type VerificationActionModalParams = {
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
  initialStatus: ConventionStatus;
  verificationAction: VerificationActionWithModal;
  convention: ConventionDto;
  currentSignatoryRoles: Role[];
  onCloseValidatorModalWithoutValidatorInfo?: Dispatch<
    SetStateAction<string | null>
  >;
  modalTitle: string;
};

type VerificationActionLinkParams = {
  verificationAction: VerificationActionWithLink;
  convention: ConventionReadDto;
  jwt: string;
};

export type VerificationActionParams = BaseVerificationActionParams &
  (VerificationActionLinkParams | VerificationActionModalParams);

const verificationActionsWithModal = [
  "ACCEPT_COUNSELLOR",
  "ACCEPT_VALIDATOR",
  "REJECT",
  "CANCEL",
  "DEPRECATE",
  "TRANSFER",
  "RENEW",
  "EDIT_COUNSELLOR_NAME",
  "BROADCAST_AGAIN",
  "MARK_AS_HANDLED",
  "FILL_ASSESSMENT_INFO",
  "SIGN",
] as const;

const verificationActionsWithLink = [
  "ACCESS_CONVENTION",
  "ACCESS_ASSESSMENT",
  "FILL_ASSESSMENT",
  "DECLARE_ABANDONMENT",
  "EDIT_CONVENTION",
  "DUPLICATE_CONVENTION",
] as const;

const allVerificationActions = [
  ...verificationActionsWithModal,
  ...verificationActionsWithLink,
] as const;
export type VerificationAction = (typeof allVerificationActions)[number];
export type VerificationActionWithModal =
  (typeof verificationActionsWithModal)[number];
export type VerificationActionWithLink =
  (typeof verificationActionsWithLink)[number];

export const newStatusByVerificationAction = {
  ACCEPT_COUNSELLOR: "ACCEPTED_BY_COUNSELLOR",
  ACCEPT_VALIDATOR: "ACCEPTED_BY_VALIDATOR",
  REJECT: "REJECTED",
  CANCEL: "CANCELLED",
  DEPRECATE: "DEPRECATED",
} satisfies Record<
  Exclude<
    VerificationActionWithModal,
    | "TRANSFER"
    | "RENEW"
    | "EDIT_COUNSELLOR_NAME"
    | "BROADCAST_AGAIN"
    | "MARK_AS_HANDLED"
    | "FILL_ASSESSMENT_INFO"
    | "SIGN"
  >,
  ConventionStatus
>;

export type VerificationActionProps =
  | {
      buttonProps: ButtonProps & {
        children: string;
        linkProps: Link;
        id: string;
        iconId?: FrIconClassName | RiIconClassName;
        iconPosition?: "left" | "right";
      };
      modalWrapperProps: null;
    }
  | {
      buttonProps: ButtonProps & {
        children: string;
        id: string;
        iconId?: FrIconClassName | RiIconClassName;
        iconPosition?: "left" | "right";
      };
      modalWrapperProps: ModalWrapperProps;
    };

export const getVerificationActionProps = (
  params: VerificationActionParams,
): VerificationActionProps => {
  if (
    verificationActionsWithLink.includes(
      params.verificationAction as VerificationActionWithLink,
    )
  ) {
    const {
      verificationAction,
      children,
      convention,
      jwt,
      buttonId,
      iconId,
      iconPosition,
    } = params as BaseVerificationActionParams & VerificationActionLinkParams;

    const link = linkByAction(verificationAction, {
      convention,
      jwt,
    });

    return {
      buttonProps: {
        children,
        linkProps: link,
        id: buttonId,
        iconId,
        iconPosition,
      },
      modalWrapperProps: null,
    } as VerificationActionProps;
  }

  const {
    verificationAction,
    disabled,
    children,
    onSubmit,
    convention,
    currentSignatoryRoles,
    initialStatus,
    onCloseValidatorModalWithoutValidatorInfo,
    modalTitle,
    buttonId,
    iconId,
    iconPosition,
  } = params as BaseVerificationActionParams & VerificationActionModalParams;

  return {
    buttonProps: {
      children,
      onClick: () => modalByAction(verificationAction).openModal(),
      disabled,
      id: buttonId,
      iconId,
      iconPosition,
    },
    modalWrapperProps: {
      title: modalTitle,
      initialStatus: initialStatus,
      verificationAction: verificationAction,
      onSubmit,
      convention: convention,
      currentSignatoryRoles: currentSignatoryRoles,
      onCloseValidatorModalWithoutValidatorInfo:
        onCloseValidatorModalWithoutValidatorInfo,
    },
  } as VerificationActionProps;
};
