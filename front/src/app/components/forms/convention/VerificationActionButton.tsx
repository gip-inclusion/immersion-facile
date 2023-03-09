import React, { useState } from "react";
import {
  ConventionStatus,
  doesStatusNeedsJustification,
  domElementIds,
  UpdateConventionStatusRequestDto,
} from "shared";
import { JustificationModal } from "src/app/components/forms/convention/JustificationModal";
import { Button } from "@codegouvfr/react-dsfr/Button";

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
  let className = "fr-btn fr-m-1w";
  switch (newStatus) {
    case "REJECTED":
      // cross icon
      className += " fr-fi-close-circle-line fr-btn--icon-left";
      break;
    case "DRAFT":
      // pencil icon
      className += " fr-fi-edit-fill fr-btn--icon-left";
      break;
    default:
      // checkbox icon
      className += " fr-fi-checkbox-circle-line fr-btn--icon-left";
      break;
  }
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        priority={newStatus === "REJECTED" ? "secondary" : "primary"}
        onClick={() => {
          doesStatusNeedsJustification(newStatus)
            ? setIsOpen(true)
            : onSubmit({ status: newStatus });
        }}
        className={className}
        disabled={disabled}
        nativeButtonProps={{
          id:
            newStatus === "REJECTED"
              ? domElementIds.conventionToValidate
                  .conventionValidationRejectButton
              : domElementIds.conventionToValidate
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
