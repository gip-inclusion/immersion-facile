import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  RadioButtons,
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { UseFormRegisterReturn, useFormContext } from "react-hook-form";
import { DotNestedKeys, FormEstablishmentDto, emailSchema } from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { Mode } from "./EstablishmentForm";

import { EmailValidationInput } from "../commons/EmailValidationInput";

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
  readOnly,
  mode,
}: { readOnly?: boolean; mode: Mode }) => {
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const formContents = getFormFields();
  const { setValue, register, watch, getValues, formState } =
    useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError(formState);
  return (
    <div className={fr.cx("fr-input-group")}>
      <h2 className={fr.cx("fr-text--lead")}>
        Qui répondra aux demandes des candidats ?
      </h2>
      <Input
        disabled={readOnly}
        label={formContents["businessContact.firstName"].label}
        hintText={formContents["businessContact.firstName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.firstName"],
          ...register("businessContact.firstName"),
        }}
        {...getFieldError("businessContact.firstName")}
      />
      <Input
        disabled={readOnly}
        label={formContents["businessContact.lastName"].label}
        hintText={formContents["businessContact.lastName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.lastName"],
          ...register("businessContact.lastName"),
        }}
        {...getFieldError("businessContact.lastName")}
      />
      <Input
        disabled={readOnly}
        label={formContents["businessContact.job"].label}
        hintText={formContents["businessContact.job"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.job"],
          ...register("businessContact.job"),
        }}
        {...getFieldError("businessContact.job")}
      />
      <Input
        disabled={readOnly}
        label={formContents["businessContact.phone"].label}
        hintText={formContents["businessContact.phone"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.phone"],
          ...register("businessContact.phone"),
        }}
        {...getFieldError("businessContact.phone")}
      />
      <EmailValidationInput
        disabled={readOnly}
        label={formContents["businessContact.email"].label}
        hintText={formContents["businessContact.email"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.email"],
          ...register("businessContact.email"),
        }}
        {...getFieldError(
          "businessContact.email" as DotNestedKeys<FormEstablishmentDto>,
        )} // seems we have an issue with our DotNestedKeys
      />
      <MultipleEmailsInput
        disabled={readOnly}
        {...formContents["businessContact.copyEmails"]}
        valuesInList={watch().businessContact.copyEmails}
        initialValue={getValues().businessContact.copyEmails.join(", ")}
        setValues={(newValues) => {
          setValue("businessContact.copyEmails", newValues);
        }}
        validationSchema={emailSchema}
      />
      <RadioButtons
        disabled={readOnly}
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
