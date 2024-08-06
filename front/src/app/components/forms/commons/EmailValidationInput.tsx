import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ValidateEmailFeedback, ValidateEmailStatus } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

type EmailValidationInputProps = InputProps.RegularInput & {
  onEmailValidationFeedback?: (feedback: StateRelated) => void;
};

type StateRelated = {
  state: InputProps.Common["state"];
  stateRelatedMessage: InputProps.Common["stateRelatedMessage"];
};

const emailSeemsValidMessage = "L'adresse email a l'air valide";

// https://help.emailable.com/en-us/article/verification-results-all-possible-states-and-reasons-fjsjn2/
export const makeStateRelated = (
  feedback: ValidateEmailFeedback,
): StateRelated => stateRelatedByValidationStatus(feedback)[feedback.status];

export const EmailValidationInput = (props: EmailValidationInputProps) => {
  const [currentInputValue, setCurrentInputValue] = useState<string>("");
  const { trigger } = useFormContext();
  const { state, stateRelatedMessage } = props;
  const [stateRelated, setStateRelated] = useState<StateRelated>({
    state,
    stateRelatedMessage,
  });

  const onBlur = async (): Promise<void> =>
    trigger(props.nativeInputProps?.name)
      .then((isFieldValid) =>
        currentInputValue && isFieldValid
          ? outOfReduxDependencies.technicalGateway.getEmailStatus(
              currentInputValue,
            )
          : undefined,
      )
      .then((emailValidationStatus) => {
        if (emailValidationStatus) {
          const feedback = makeStateRelated(emailValidationStatus);
          props.onEmailValidationFeedback?.(feedback);
          setStateRelated(feedback);
        }
      })
      .catch((error) => {
        console.error(error);
        const feedback = makeStateRelated({
          status: "unexpected_error",
          proposal: null,
        });
        props.onEmailValidationFeedback?.(feedback);
        setStateRelated(feedback);
      });

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        onBlur,
        onChange,
        type: "email",
      }}
      {...stateRelated}
    />
  );
};

const makeStateRelatedMessage = (
  feedback: ValidateEmailFeedback,
  message: string,
): React.ReactNode =>
  `${message}${
    feedback.proposal ? `Avez-vous voulu taper '${feedback.proposal}' ?` : ""
  }`;

const stateRelatedByValidationStatus = (
  feedback: ValidateEmailFeedback,
): Record<ValidateEmailStatus, StateRelated> => ({
  accepted_email: {
    state: "success",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      emailSeemsValidMessage,
    ),
  },
  low_deliverability: {
    state: "success",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      emailSeemsValidMessage,
    ),
  },
  low_quality: {
    state: "success",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      emailSeemsValidMessage,
    ),
  },
  disposable_email: {
    state: "error",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      "L'adresse email semble être une adresse jetable",
    ),
  },
  invalid_domain: {
    state: "error",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      "Le domaine de l'email proposé ( après @ ) n'est pas valide ou n'existe pas.",
    ),
  },
  invalid_email: {
    state: "error",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      "L'email n'est pas valide.",
    ),
  },
  rejected_email: {
    state: "error",
    stateRelatedMessage: makeStateRelatedMessage(
      feedback,
      "Cette adresse email n'existe pas.",
    ),
  },
  invalid_smtp: {
    state: "default",
    stateRelatedMessage: makeStateRelatedMessage(feedback, ""),
  },
  unexpected_error: {
    state: "default",
    stateRelatedMessage: makeStateRelatedMessage(feedback, ""),
  },
  unavailable_smtp: {
    state: "default",
    stateRelatedMessage: makeStateRelatedMessage(feedback, ""),
  },
  no_connect: {
    state: "default",
    stateRelatedMessage: makeStateRelatedMessage(feedback, ""),
  },
  service_unavailable: {
    state: "default",
    stateRelatedMessage: makeStateRelatedMessage(feedback, ""),
  },
});
