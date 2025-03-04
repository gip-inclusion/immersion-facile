import { fr } from "@codegouvfr/react-dsfr";
import {
  RadioButtons,
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import React, { Dispatch, SetStateAction, useState } from "react";
import { UseFormRegisterReturn, useFormContext } from "react-hook-form";
import { FormEstablishmentDto } from "shared";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
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
  const { register, formState } = useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError(formState);
  const [emailModified, _setEmailModified] = useState(false);

  const areNamesFieldReadOnly = mode !== "create" && !emailModified;
  const _readOnlyFieldMessage = areNamesFieldReadOnly
    ? "Les noms et prénoms sont associés à l'email, si vous souhaitez en changer, veuillez modifier l'email de contact"
    : undefined;

  return (
    <div className={fr.cx("fr-input-group")}>
      <h2 className={fr.cx("fr-text--lead")}>
        Qui répondra aux demandes des candidats ?
      </h2>

      {// USER RIGHTS SECTION }


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
