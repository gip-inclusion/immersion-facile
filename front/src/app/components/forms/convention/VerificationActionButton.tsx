import React, { useState } from "react";
import {
  ConventionStatus,
  doesStatusNeedsJustification,
  domElementIds,
  UpdateConventionStatusRequestDto,
} from "shared";
import { JustificationModal } from "src/app/components/forms/convention/JustificationModal";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";

export type VerificationActionButtonProps = {
  onSubmit: (params: UpdateConventionStatusRequestDto) => void;
  disabled?: boolean;
  newStatus: ConventionStatus;
  children: string;
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
  const [isOpen, setIsOpen] = useState(false);

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
          id:
            newStatus === "REJECTED"
              ? domElementIds.manageConvention.conventionValidationRejectButton
              : domElementIds.manageConvention
                  .conventionValidationValidateButton,
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
