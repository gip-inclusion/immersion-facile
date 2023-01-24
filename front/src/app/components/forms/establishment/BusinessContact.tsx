import { useFormikContext } from "formik";
import React from "react";
import { ContactMethod, FormEstablishmentDto, zEmail } from "shared";
import { RadioGroupForField } from "src/app/components/forms/commons/RadioGroup";
import { FillableList } from "src/app/components/forms/commons/FillableList";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { fr } from "@codegouvfr/react-dsfr";

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod;
}> = [
  {
    value: "EMAIL",
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: "PHONE",
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: "IN_PERSON",
    label: "Se présenter en personne à votre établissement",
  },
];

export const BusinessContact = () => {
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  const { values, setFieldValue } = useFormikContext<FormEstablishmentDto>();
  return (
    <div className={fr.cx("fr-input-group")}>
      <div>
        <h2 className={fr.cx("fr-text--lead")}>
          Détails du correspondant immersion :
        </h2>
        <p>Le correspondant reçoit les demandes et les traite.</p>
      </div>
      <TextInput {...formContents["businessContact.lastName"]} />
      <TextInput {...formContents["businessContact.firstName"]} />
      <TextInput {...formContents["businessContact.job"]} />
      <TextInput {...formContents["businessContact.phone"]} />
      <TextInput {...formContents["businessContact.email"]} />
      <FillableList
        {...formContents["businessContact.copyEmails"]}
        valuesInList={values.businessContact.copyEmails}
        setValues={(newValues) => {
          setFieldValue("businessContact.copyEmails", newValues);
        }}
        validationSchema={zEmail}
      />
      <RadioGroupForField
        {...formContents["businessContact.contactMethod"]}
        options={preferredContactMethodOptions}
      />
    </div>
  );
};
