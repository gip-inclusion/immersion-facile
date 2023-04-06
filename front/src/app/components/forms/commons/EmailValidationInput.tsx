import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";
import React, { useState } from "react";
import {
  EmailValidationReason,
  EmailValidationStatus,
  isValidEmail,
} from "src/../../shared/src";
import { emailValidationGateway } from "src/config/dependencies";

type EmailValidationInputProps = InputProps.RegularInput & {
  onEmailValidationFeedback: (status: EmailValidationStatus) => void;
};

type StateRelated = {
  state: InputProps.Common["state"];
  stateRelatedMessage: InputProps.Common["stateRelatedMessage"];
};

const defaultErrorMessage =
  "L'adresse email ne semble pas valide. Si vous êtes sûr de ne pas avoir fait d'erreur, vous pouvez tout de même faire une demande de convention.";

const feedbackMessages: Record<EmailValidationReason, string> = {
  invalid_domain: defaultErrorMessage,
  invalid_email: defaultErrorMessage,
  accepted_email: "L'adresse email a l'air valide",
  disposable_email: "L'adresse email semble être une adresse jetable",
  rejected_email: defaultErrorMessage,
  invalid_smtp: defaultErrorMessage,
  low_deliverability: "L'adresse email a l'air valide",
  low_quality: "L'adresse email a l'air valide",
  unexpected_error: defaultErrorMessage,
};

export const EmailValidationInput = (props: EmailValidationInputProps) => {
  const [stateRelated, setStateRelated] = useState<StateRelated>({
    state: "default",
    stateRelatedMessage: "",
  });
  const onInputBlur = (event: React.FocusEvent<HTMLInputElement, Element>) => {
    const email = event.target.value;
    if (email === "" || !isValidEmail(email))
      props.onEmailValidationFeedback({
        isValid: false,
        reason: "invalid_domain",
        isFree: false,
        proposal: null,
      });

    emailValidationGateway
      .getEmailStatus(email)
      .then((status) => {
        props.nativeInputProps?.onBlur?.(event);
        props.onEmailValidationFeedback(status);
        setStateRelated(getStateRelatedFromStatus(status));
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
  const getStateRelatedFromStatus = (
    status: EmailValidationStatus,
  ): StateRelated => ({
    state: status.isValid ? "success" : "error",
    stateRelatedMessage:
      feedbackMessages[status.reason] +
      (status.proposal
        ? `, est-ce que vous avez voulu taper : ${status.proposal} ?`
        : ""),
  });
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
