import React from "react";
import { useFormContext, UseFormRegisterReturn } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { DotNestedKeys, emailSchema, FormEstablishmentDto } from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { RadioButtonOption } from "src/app/contents/forms/common/values";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { EmailValidationInput } from "../commons/EmailValidationInput";

const preferredContactMethodOptions = (
  register: UseFormRegisterReturn<string>,
): RadioButtonOption[] => [
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

export const BusinessContact = () => {
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  const { setValue, register, watch, getValues, formState } =
    useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError(formState);
  return (
    <div className={fr.cx("fr-input-group")}>
      <div>
        <h2 className={fr.cx("fr-text--lead")}>
          Détails du correspondant immersion :
        </h2>
        <p>Le correspondant reçoit les demandes et les traite.</p>
      </div>
      <Input
        label={formContents["businessContact.firstName"].label}
        hintText={formContents["businessContact.firstName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.firstName"],
          ...register("businessContact.firstName"),
        }}
        {...getFieldError("businessContact.firstName")}
      />
      <Input
        label={formContents["businessContact.lastName"].label}
        hintText={formContents["businessContact.lastName"].hintText}
        nativeInputProps={{
          ...formContents["businessContact.lastName"],
          ...register("businessContact.lastName"),
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
          ...register("businessContact.email"),
        }}
        {...getFieldError(
          "businessContact.email" as DotNestedKeys<FormEstablishmentDto>,
        )} // seems we have an issue with our DotNestedKeys
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
      <h2 className={fr.cx("fr-text--lead")}>
        Mises en relation avec les candidats :
      </h2>
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
