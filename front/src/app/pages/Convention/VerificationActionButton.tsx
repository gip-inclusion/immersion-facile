import React from "react";
import { Button } from "react-design-system/immersionFacile";
import { ConventionReadDto, ConventionStatus } from "shared";
import { conventionGateway } from "src/app/config/dependencies";

export type VerificationActionButtonProps = {
  convention?: ConventionReadDto;
  jwt: string;
  disabled?: boolean;
  messageToShowOnSuccess: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  newStatus: ConventionStatus;
  children: string;
};

const onSubmit = async ({
  convention,
  jwt,
  onSuccess,
  onError,
  newStatus,
  messageToShowOnSuccess,
}: VerificationActionButtonProps) => {
  if (!convention) return;

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

  return conventionGateway
    .updateStatus({ status: newStatus, justification }, jwt)
    .then(() => onSuccess(messageToShowOnSuccess))
    .catch((e) => onError(e.message));
};

export const VerificationActionButton = (
  props: VerificationActionButtonProps,
) => {
  let className = "fr-btn";
  switch (props.newStatus) {
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
      level={props.newStatus === "REJECTED" ? "secondary" : "primary"}
      disable={!props.convention || props.disabled}
      onSubmit={() => onSubmit(props)}
      className={className}
    >
      {props.children}
    </Button>
  );
};
