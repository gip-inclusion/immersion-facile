import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  RadioButtons,
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import React, { Dispatch, SetStateAction, useState } from "react";
import { UseFormRegisterReturn, useFormContext } from "react-hook-form";
import {
  DotNestedKeys,
  FormEstablishmentDto,
  emailSchema,
  toLowerCaseWithoutDiacritics,
} from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { EmailValidationInput } from "../commons/EmailValidationInput";
import { Mode } from "./EstablishmentForm";

const preferredContactMethodOptions = (
  register: UseFormRegisterReturn<string>,
): RadioButtonsProps["options"] => [
  {
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
    nativeInputProps: {
      value: "EMAIL",
      ...register,
    },
  },
  {
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
    nativeInputProps: {
      value: "PHONE",
      ...register,
    },
  },
  {
    label: "Se présenter en personne à votre établissement",
    nativeInputProps: {
      value: "IN_PERSON",
      ...register,
    },
  },
];

export const BusinessContact = ({
  mode,
  setInvalidEmailMessage,
}: {
  mode: Mode;
  setInvalidEmailMessage: Dispatch<SetStateAction<React.ReactNode | null>>;
}) => {
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const formContents = getFormFields();
  const { setValue, register, watch, getValues, formState } =
    useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError(formState);
  const [emailModified, setEmailModified] = useState(false);

  const areNamesFieldReadOnly = mode !== "create" && !emailModified;
  const readOnlyFieldMessage = areNamesFieldReadOnly
    ? "Les noms et prénoms sont associés à l'email, si vous souhaitez en changer, veuillez modifier l'email de contact"
    : undefined;

  return (
    <div className={fr.cx("fr-input-group")}>
      <h2 className={fr.cx("fr-text--lead")}>
        Qui répondra aux demandes des candidats ?
      </h2>
      <Input
        label={formContents["businessContact.firstName"].label}
        hintText={formContents["businessContact.firstName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.firstName"],
          ...register("businessContact.firstName"),
          readOnly: areNamesFieldReadOnly,
          title: readOnlyFieldMessage,
        }}
        {...getFieldError("businessContact.firstName")}
      />
      <Input
        label={formContents["businessContact.lastName"].label}
        hintText={formContents["businessContact.lastName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.lastName"],
          ...register("businessContact.lastName"),
          readOnly: areNamesFieldReadOnly,
          title: readOnlyFieldMessage,
        }}
        {...getFieldError("businessContact.lastName")}
      />
      <Input
        label={formContents["businessContact.job"].label}
        hintText={formContents["businessContact.job"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.job"],
          ...register("businessContact.job"),
        }}
        {...getFieldError("businessContact.job")}
      />
      <Input
        label={formContents["businessContact.phone"].label}
        hintText={formContents["businessContact.phone"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.phone"],
          ...register("businessContact.phone"),
        }}
        {...getFieldError("businessContact.phone")}
      />
      <EmailValidationInput
        label={formContents["businessContact.email"].label}
        hintText={formContents["businessContact.email"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.email"],
          ...register("businessContact.email", {
            setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
          }),
          onChange: (event) => {
            setEmailModified(true);
            setValue("businessContact.email", event.currentTarget.value);
          },
          onBlur: (event) => {
            setValue(
              "businessContact.email",
              toLowerCaseWithoutDiacritics(event.currentTarget.value),
            );
          },
        }}
        {...getFieldError(
          "businessContact.email" as DotNestedKeys<FormEstablishmentDto>,
        )} // seems we have an issue with our DotNestedKeys
        onEmailValidationFeedback={({ state, stateRelatedMessage }) =>
          setInvalidEmailMessage(state === "error" ? stateRelatedMessage : null)
        }
      />
      <MultipleEmailsInput
        {...formContents["businessContact.copyEmails"]}
        valuesInList={watch().businessContact.copyEmails}
        initialValue={getValues().businessContact.copyEmails.join(", ")}
        setValues={(newValues) => {
          setValue("businessContact.copyEmails", newValues);
        }}
        validationSchema={emailSchema}
      />
      <RadioButtons
        {...formContents["businessContact.contactMethod"]}
        legend={formContents["businessContact.contactMethod"].label}
        hintText={formContents["businessContact.contactMethod"].hintText}
        {...register("businessContact.contactMethod")}
        options={preferredContactMethodOptions(
          register("businessContact.contactMethod"),
        )}
        {...getFieldError("businessContact.contactMethod")}
      />
    </div>
  );
};
