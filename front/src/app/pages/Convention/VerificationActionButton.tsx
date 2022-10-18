import React from "react";
import { Button } from "react-design-system/immersionFacile";
import { ConventionStatus } from "shared";

export type VerificationActionButtonProps = {
  onSubmit: (params: {
    newStatus: ConventionStatus;
    justification?: string;
  }) => void;
  disabled?: boolean;
  newStatus: ConventionStatus;
  children: string;
};

const promptForMessageIfNeeded = (
  newStatus: ConventionStatus,
): string | undefined => {
  let justification: string | undefined = undefined;
  if (newStatus === "REJECTED") {
    justification =
      prompt("Pourquoi l'immersion est-elle refusée ?") ?? undefined;
    if (!justification) return; // case when cancel button is clicked or field is empty
  } else if (newStatus === "DRAFT") {
    justification =
      prompt("Precisez la raison et la modification nécessaire") ?? undefined;
    if (!justification) return; // case when cancel button is clicked or field is empty
  }

  return justification;
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

  return (
    <Button
      level={newStatus === "REJECTED" ? "secondary" : "primary"}
      disable={disabled}
      onSubmit={() => {
        const justification = promptForMessageIfNeeded(newStatus);
        onSubmit({ newStatus, justification });
      }}
      className={className}
    >
      {children}
    </Button>
  );
};
