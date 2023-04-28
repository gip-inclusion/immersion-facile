import React, { useState } from "react";
import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  ConventionStatus,
  doesStatusNeedsJustification,
  domElementIds,
  UpdateConventionStatusRequestDto,
} from "shared";
import { JustificationModal } from "src/app/components/forms/convention/JustificationModal";

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
  const [isOpen, setIsOpen] = useState(false);
  const actionButtonStatusId: Record<VerificationActions, string> = {
    DRAFT: domElementIds.manageConvention.conventionValidationRequestEditButton,
    REJECTED: domElementIds.manageConvention.conventionValidationRejectButton,
    ACCEPTED_BY_VALIDATOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    ACCEPTED_BY_COUNSELLOR:
      domElementIds.manageConvention.conventionValidationValidateButton,
    CANCELLED: domElementIds.manageConvention.conventionValidationCancelButton,
  };

  return (
    <>
      <Button
        iconId={selectedIcon ?? "fr-icon-checkbox-circle-line"}
        priority={newStatus === "REJECTED" ? "secondary" : "primary"}
        onClick={() => {
          doesStatusNeedsJustification(newStatus)
            ? setIsOpen(true)
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
        <JustificationModal
          title={children}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          onSubmit={onSubmit}
          newStatus={newStatus}
        />
      )}
    </>
  );
};
