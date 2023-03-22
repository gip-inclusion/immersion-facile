import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import React, {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { useFormContext, UseFormRegisterReturn } from "react-hook-form";
import { FormEstablishmentDto, zEmail } from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";

const preferredContactMethodOptions = (
  register: UseFormRegisterReturn,
): // register:UseFormRegister<FormEstablishmentDto>
{
  label: ReactNode;
  hintText?: ReactNode;
  nativeInputProps: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}[] => [
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
  const { setValue, register, watch } = useFormContext<FormEstablishmentDto>();

  return (
    <div className={fr.cx("fr-input-group")}>
      <div>
        <h2 className={fr.cx("fr-text--lead")}>
          Détails du correspondant immersion :
        </h2>
        <p>Le correspondant reçoit les demandes et les traite.</p>
      </div>
      <Input
        {...formContents["businessContact.firstName"]}
        nativeInputProps={register("businessContact.firstName")}
      />
      <Input
        {...formContents["businessContact.lastName"]}
        nativeInputProps={register("businessContact.lastName")}
      />
      <Input
        {...formContents["businessContact.job"]}
        nativeInputProps={register("businessContact.job")}
      />
      <Input
        {...formContents["businessContact.phone"]}
        nativeInputProps={register("businessContact.phone")}
      />
      <Input
        {...formContents["businessContact.email"]}
        nativeInputProps={register("businessContact.email")}
      />
      <MultipleEmailsInput
        {...formContents["businessContact.copyEmails"]}
        valuesInList={watch().businessContact.copyEmails}
        setValues={(newValues) => {
          setValue("businessContact.copyEmails", newValues);
        }}
        validationSchema={zEmail}
      />
      <h2 className={fr.cx("fr-text--lead")}>
        Mises en relation avec les candidats :
      </h2>
      <RadioButtons
        {...formContents["businessContact.contactMethod"]}
        {...register("businessContact.contactMethod")}
        options={preferredContactMethodOptions(
          register("businessContact.contactMethod"),
        )}
      />
    </div>
  );
};
