import React, { useState } from "react";
import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";

import { ValidateEmailReason, ValidateEmailStatus } from "shared";

import { emailValidationGateway } from "src/config/dependencies";

type EmailValidationInputProps = InputProps.RegularInput & {
  onEmailValidationFeedback?: (status: ValidateEmailStatus) => void;
};

type StateRelated = {
  state: InputProps.Common["state"];
  stateRelatedMessage: InputProps.Common["stateRelatedMessage"];
};

const defaultErrorMessage =
  "L'adresse email ne semble pas valide. Si vous êtes sûr de ne pas avoir fait d'erreur, vous pouvez tout de même faire une demande de convention.";

const feedbackMessages = (
  proposal: string | null | undefined,
): Record<ValidateEmailReason, string> => ({
  accepted_email: "L'adresse email a l'air valide",
  disposable_email: "L'adresse email semble être une adresse jetable",
  low_deliverability: "L'adresse email a l'air valide",
  low_quality: "L'adresse email a l'air valide",
  unexpected_error: defaultErrorMessage,
  invalid_domain: defaultErrorMessage,
  invalid_email: defaultErrorMessage,
  rejected_email: proposal
    ? `Cette adresse email ne semble pas valide, avez-vous voulu taper : ${proposal} ?`
    : defaultErrorMessage,
  invalid_smtp: defaultErrorMessage,
});

const getStateRelatedFromStatus = (
  status: ValidateEmailStatus,
  stateRelated: StateRelated,
): StateRelated => {
  if (stateRelated.state === "error")
    return {
      state: stateRelated.state,
      stateRelatedMessage: stateRelated.stateRelatedMessage,
    };
  return {
    state: status.isValid ? "success" : "error",
    stateRelatedMessage: feedbackMessages(status.proposal)[status.reason],
  };
};

export const EmailValidationInput = (props: EmailValidationInputProps) => {
  const [stateRelated, setStateRelated] = useState<StateRelated>({
    state: props.state,
    stateRelatedMessage: props.stateRelatedMessage,
  });
  const onInputBlur = (
    event: React.FocusEvent<HTMLInputElement, Element>,
  ): void => {
    const email = event.target.value;
    if (props.state === "error") {
      setStateRelated({
        state: props.state,
        stateRelatedMessage: props.stateRelatedMessage,
      });
      return;
    }

    emailValidationGateway
      .getEmailStatus(email)
      .then((status) => {
        props.nativeInputProps?.onBlur?.(event);
        props.onEmailValidationFeedback?.(status);
        setStateRelated(
          getStateRelatedFromStatus(status, {
            state: props.state,
            stateRelatedMessage: props.stateRelatedMessage,
          }),
        );
      })
      .catch((error) => {
        // do nothing on HTTP request error
        // eslint-disable-next-line no-console
        console.error(error);
      });
  };
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStateRelated({
      state: "default",
      stateRelatedMessage: "",
    });
    props.nativeInputProps?.onChange?.(event);
  };

  return (
    <Input
      {...props}
      nativeInputProps={{
        ...props.nativeInputProps,
        onBlur: onInputBlur,
        onChange: onInputChange,
        type: "email",
      }}
      {...stateRelated}
    />
  );
};
