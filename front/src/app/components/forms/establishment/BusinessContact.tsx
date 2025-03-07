import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  RadioButtons,
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { UseFormRegisterReturn, useFormContext } from "react-hook-form";
import {
  ContactFormEstablishmentUserRight,
  FormEstablishmentDto,
  emailSchema,
} from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
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
}: {
  mode: Mode;
}) => {
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const formContents = getFormFields();
  const { setValue, register, getValues, formState } =
    useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError<FormEstablishmentDto>(formState);

  const establishmentContactsEmails = getValues("userRights")
    .filter((userRight) => userRight.role === "establishment-contact")
    .map((userRight) => userRight.email);
  const establishmentAdminsRights = getValues("userRights").filter(
    (userRight) => userRight.role === "establishment-admin",
  );
  return (
    <div className={fr.cx("fr-input-group")}>
      <h2 className={fr.cx("fr-text--lead")}>
        Qui répondra aux demandes des candidats ?
      </h2>
      <Input
        label={"Prénom du référent"}
        hintText={
          "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
        }
        nativeInputProps={{
          readOnly: true,
          value: federatedIdentity?.firstName,
        }}
      />
      <Input
        label={"Nom du référent"}
        hintText={
          "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
        }
        nativeInputProps={{
          readOnly: true,
          value: federatedIdentity?.lastName,
        }}
      />
      <Input
        label={"Email du référent"}
        hintText={
          "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
        }
        nativeInputProps={{
          readOnly: true,
          ...register("userRights.0.email"),
          value: getValues("userRights.0.email"),
        }}
      />
      {/* Ancienne implem email complètement différente du nouveau input pour l'email ?
      
      
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
      /> */}
      <Input
        label={formContents["userRights.0.job"].label}
        hintText={formContents["userRights.0.job"].hintText}
        nativeInputProps={{
          ...formContents["userRights.0.job"],
          ...register("userRights.0.job"),
          defaultValue: getValues("userRights.0.job"),
        }}
        {...getFieldError("userRights.0.job")}
      />
      <Input
        label={formContents["userRights.0.phone"].label}
        hintText={formContents["userRights.0.phone"].hintText}
        nativeInputProps={{
          ...formContents["userRights.0.phone"],
          ...register("userRights.0.phone"),
          defaultValue: getValues("userRights.0.phone"),
        }}
        {...getFieldError("userRights.0.phone")}
      />

      <MultipleEmailsInput
        {...formContents.userRights}
        valuesInList={establishmentContactsEmails}
        initialValue={establishmentContactsEmails.join(", ")}
        setValues={(newValues) => {
          setValue("userRights", [
            ...establishmentAdminsRights,
            ...newValues.map(
              (email) =>
                ({
                  email,
                  role: "establishment-contact",
                }) satisfies ContactFormEstablishmentUserRight,
            ),
          ]);
        }}
        validationSchema={emailSchema}
      />
      <RadioButtons
        {...formContents.contactMethod}
        legend={formContents.contactMethod.label}
        hintText={formContents.contactMethod.hintText}
        {...register("contactMethod")}
        options={preferredContactMethodOptions(register("contactMethod"))}
        {...getFieldError("contactMethod")}
      />
    </div>
  );
};
