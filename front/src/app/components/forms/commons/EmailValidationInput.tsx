import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ValidateEmailReason, ValidateEmailStatus } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

type EmailValidationInputProps = InputProps.RegularInput & {
  onEmailValidationFeedback?: (status: ValidateEmailStatus) => void;
};

type StateRelated = {
  state: InputProps.Common["state"];
  stateRelatedMessage: InputProps.Common["stateRelatedMessage"];
};

const defaultErrorMessage =
  "L'adresse email ne semble pas valide. Si vous êtes sûr de ne pas avoir fait d'erreur, vous pouvez tout de même la proposer.";
const emailSeemsValidMessage = "L'adresse email a l'air valide";
const noVerifyMessage =
  "Il y a un problème de connexion qui ne nous permet pas de vérifier votre email. Veuillez vous assurer de n'avoir pas fait une erreur.";

// https://help.emailable.com/en-us/article/verification-results-all-possible-states-and-reasons-fjsjn2/
export const feedbackMessages = (
  proposal: string | null | undefined,
): Record<ValidateEmailReason, string> => ({
  accepted_email: emailSeemsValidMessage,
  disposable_email: "L'adresse email semble être une adresse jetable",
  low_deliverability: emailSeemsValidMessage,
  low_quality: emailSeemsValidMessage,
  invalid_domain:
    "Le domaine de l'email proposé ( après @ ) n'est pas valide ou n'existe pas.",
  invalid_email: "L'email n'est pas valide.",
  rejected_email: `Cette adresse email n'existe pas ${
    proposal ? `, avez-vous voulu taper : ${proposal} ?` : "."
  }`,
  invalid_smtp:
    "Le système propriétaire de l'email fourni n'est pas disponible pour vérifier la validité de l'email",
  unavailable_smtp:
    "Le système propriétaire de l'email fourni n'est pas disponible pour vérifier la validité de l'email",
  unexpected_error:
    "L'email n'a pas pu être vérifié suite à une erreur inconnue, veuillez bien vérifier par vous même que l'email soit valide.",
  no_connect: noVerifyMessage,
  service_unavailable: noVerifyMessage,
});

export const validateEmailBlockReasons: ValidateEmailReason[] = [
  "invalid_domain",
  "invalid_email",
  "rejected_email",
];

const getStateRelatedFromStatus = (
  { isValid, proposal, reason }: ValidateEmailStatus,
  { state, stateRelatedMessage }: StateRelated,
): StateRelated =>
  state === "error"
    ? {
        state,
        stateRelatedMessage,
      }
    : {
        state: isValid ? "success" : "error",
        stateRelatedMessage: reason
          ? feedbackMessages(proposal)[reason]
          : defaultErrorMessage,
      };

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
          props.onEmailValidationFeedback?.(emailValidationStatus);
          setStateRelated(
            getStateRelatedFromStatus(emailValidationStatus, {
              state: stateRelated.state,
              stateRelatedMessage: stateRelated.stateRelatedMessage,
            }),
          );
        }
      })
      .catch((error) => {
        //eslint-disable-next-line no-console
        console.error(error);
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
