import React from "react";
import { immersionApplicationGateway } from "src/app/main";
import { Button } from "src/components/Button";
import {
  ImmersionApplicationDto,
  ApplicationStatus,
} from "src/shared/ImmersionApplicationDto";

export type VerificationActionButtonProps = {
  immersionApplication?: ImmersionApplicationDto;
  jwt: string;
  disabled?: boolean;
  messageToShowOnSuccess: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  newStatus: ApplicationStatus;
  children: string;
};

const onSubmit = async ({
  immersionApplication,
  jwt,
  onSuccess,
  onError,
  newStatus,
  messageToShowOnSuccess,
}: VerificationActionButtonProps) => {
  if (!immersionApplication) return;

  const justification =
    newStatus === "REJECTED"
      ? prompt("Pourquoi l'immersion est-elle refusée ?") ?? undefined
      : undefined;

  return immersionApplicationGateway
    .updateStatus({ status: newStatus, justification }, jwt)
    .then(() => onSuccess(messageToShowOnSuccess))
    .catch((e) => onError(e.message));
};

export const VerificationActionButton = (
  props: VerificationActionButtonProps,
) => (
  <Button
    level={props.newStatus === "REJECTED" ? "secondary" : "primary"}
    disable={!props.immersionApplication || props.disabled}
    onSubmit={() => onSubmit(props)}
  >
    {props.children}
  </Button>
);
