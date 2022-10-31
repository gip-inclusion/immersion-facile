import { FormikHelpers, useFormikContext } from "formik";
import React, { useState } from "react";
import {
  AddressDto,
  addressDtoToString,
  AgencyKind,
  agencyKindList,
  CreateAgencyDto,
  zEmail,
} from "shared";
import { RadioGroup } from "src/app/components/RadioGroup";
import { UploadLogo } from "src/app/components/UploadLogo";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { FillableList } from "src/uiComponents/form/FillableList";
import { SimpleSelect } from "src/uiComponents/form/SimpleSelect";
import { TextInput } from "src/uiComponents/form/TextInput";

const getName = (name: keyof CreateAgencyDto) => name;

type AgencyFormCommonFieldsProps = {
  addressInitialValue?: AddressDto;
};

export const AgencyFormCommonFields = ({
  addressInitialValue,
}: AgencyFormCommonFieldsProps) => {
  const { values, setFieldValue } = useFormikContext<CreateAgencyDto>();
  const typedSetField = makeTypedSetField<CreateAgencyDto>(setFieldValue);

  const [validationSteps, setValidationSteps] = useState<
    "oneStep" | "twoSteps"
  >("oneStep");

  return (
    <>
      <SimpleSelect
        id="agency-kind"
        label="Type d'agence"
        name={getName("kind")}
        options={agencyListOfOptions}
      />
      <TextInput
        name={getName("name")}
        label="Nom de la structure"
        placeholder="Agence de Boulogne-Billancourt"
      />
      <AddressAutocomplete
        initialSearchTerm={
          addressInitialValue && addressDtoToString(addressInitialValue)
        }
        label="Adresse de la structure"
        setFormValue={({ position, address }) => {
          typedSetField("position")(position);
          typedSetField("address")(address);
        }}
      />

      <RadioGroup
        id="steps-for-validation"
        currentValue={validationSteps}
        setCurrentValue={setValidationSteps}
        groupLabel="Combien d'étapes de validation des immersions y a-t-il ? *"
        options={numberOfStepsOptions}
      />
      {validationSteps === "twoSteps" && (
        <FillableList
          name="counsellor-emails"
          label="Emails pour examen préalable de la demande de convention"
          description="Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner."
          placeholder="equipe1@mail.com, conseiller.dupont@mail.com"
          valuesInList={values.counsellorEmails}
          setValues={typedSetField("counsellorEmails")}
          validationSchema={zEmail}
        />
      )}

      <FillableList
        name="validator-emails"
        label="Emails de validation définitive de la demande de convention"
        description={descriptionByValidationSteps[validationSteps]}
        placeholder="equipe.validation@mail.com, valideur.dupont@mail.com"
        valuesInList={values.validatorEmails}
        setValues={typedSetField("validatorEmails")}
        validationSchema={zEmail}
      />

      {values.kind !== "pole-emploi" && (
        <TextInput
          name={getName("questionnaireUrl")}
          label="Avez-vous un lien vers le document de support du bilan de fin d’immersion ?"
          placeholder="https://docs.google.com/document/d/mon-document-pour-bilan"
        />
      )}

      <TextInput
        name={getName("signature")}
        label="Quel texte de signature souhaitez-vous pour les mails automatisés ?"
        placeholder="L’équipe de l’agence de Boulogne-Billancourt"
      />
    </>
  );
};

export const AgencyLogoUpload = () => {
  const { enableLogoUpload } = useFeatureFlags();
  const { values, setFieldValue } = useFormikContext<CreateAgencyDto>();
  const typedSetField = makeTypedSetField(setFieldValue);

  if (!enableLogoUpload) return null;
  return (
    <>
      <UploadLogo
        setFileUrl={typedSetField("logoUrl")}
        maxSize_Mo={2}
        label="Changer le logo"
        hint="Cela permet de personnaliser les mails automatisés."
      />
      {values.logoUrl && (
        <img src={values.logoUrl} alt="uploaded-logo" width="100px" />
      )}
    </>
  );
};

const agencyKindToLabel: Record<
  Exclude<AgencyKind, "immersion-facile">,
  string
> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pole Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  "structure-IAE": "Structure IAE",
  autre: "Autre",
};

export const agencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: agencyKindToLabel[agencyKind],
}));

type ValidationSteps = "oneStep" | "twoSteps";
const numberOfStepsOptions: Array<{ label: string; value: ValidationSteps }> = [
  {
    label: "1: La Convention est examinée et validée par la même personne",
    value: "oneStep",
  },
  {
    label:
      "2: La Convention est examinée par une personne puis validée par quelqu’un d’autre",
    value: "twoSteps",
  },
];

const descriptionByValidationSteps: Record<ValidationSteps, string> = {
  oneStep:
    "Les personnes ou emails génériques suivants recevront les demandes de Convention à valider.",
  twoSteps:
    "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
};

type MakeTypedSetField = <T extends Record<string, unknown>>(
  setFieldValue: FormikHelpers<T>["setFieldValue"],
) => <K extends Exclude<keyof T, "id">>(
  fieldName: K,
) => (fieldValue: T[K]) => void;

export const makeTypedSetField: MakeTypedSetField =
  (setFieldValue) => (fieldName) => (fieldValue) =>
    setFieldValue(fieldName as string, fieldValue);
