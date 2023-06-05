import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";
import { Email, ValidateEmailReason, ValidateEmailStatus } from "shared";
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
const emailSeemsValidMessage = "L'adresse email a l'air valide";

const feedbackMessages = (
  proposal: string | null | undefined,
): Record<ValidateEmailReason, string> => ({
  accepted_email: emailSeemsValidMessage,
  disposable_email: "L'adresse email semble être une adresse jetable",
  low_deliverability: emailSeemsValidMessage,
  low_quality: emailSeemsValidMessage,
  unexpected_error: defaultErrorMessage,
  invalid_domain: defaultErrorMessage,
  invalid_email: defaultErrorMessage,
  rejected_email: proposal
    ? `Cette adresse email ne semble pas valide, avez-vous voulu taper : ${proposal} ?`
    : defaultErrorMessage,
  invalid_smtp: defaultErrorMessage,
  unavailable_smtp: defaultErrorMessage,
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
    stateRelatedMessage: status.reason
      ? feedbackMessages(status.proposal)[status.reason]
      : defaultErrorMessage,
  };
};

export const EmailValidationInput = (props: EmailValidationInputProps) => {
  const [stateRelated, setStateRelated] = useState<StateRelated>({
    state: props.state,
    stateRelatedMessage: props.stateRelatedMessage,
  });
  const [currentInputValue, setCurrentInputValue] = useState<string>("");
  const { trigger } = useFormContext();
  useEffect(() => {
    const { state, stateRelatedMessage } = props;
    setStateRelated({
      state,
      stateRelatedMessage,
    });
  }, [props.state, props.stateRelatedMessage]);

  const onInputBlur = async () => {
    try {
      const isFieldValid = await trigger(props.nativeInputProps?.name);
      if (currentInputValue && isFieldValid) {
        await sendEmailValidationRequest(currentInputValue);
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };
  const sendEmailValidationRequest = async (email: Email) => {
    const emailValidationStatus = await emailValidationGateway.getEmailStatus(
      email,
    );
    props.onEmailValidationFeedback?.(emailValidationStatus);
    setStateRelated(
      getStateRelatedFromStatus(emailValidationStatus, {
        state: stateRelated.state,
        stateRelatedMessage: stateRelated.stateRelatedMessage,
      }),
    );
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInputValue(event.target.value);
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
