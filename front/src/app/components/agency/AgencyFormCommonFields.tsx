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
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { UploadLogo } from "src/app/components/UploadLogo";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { FillableList } from "src/app/components/forms/commons/FillableList";
import { SimpleSelect } from "src/app/components/forms/commons/SimpleSelect";
import { TextInput } from "src/app/components/forms/commons/TextInput";

const getName = (name: keyof CreateAgencyDto) => name;

type AgencyFormCommonFieldsProps = {
  addressInitialValue?: AddressDto;
};

const descriptionByValidationSteps = {
  oneStep: formAgencyFieldsLabels.counsellorEmails.description,
  twoSteps: formAgencyFieldsLabels.validatorEmails.description,
};

export const AgencyFormCommonFields = ({
  addressInitialValue,
}: AgencyFormCommonFieldsProps) => {
  const { values, setFieldValue } = useFormikContext<CreateAgencyDto>();
  const typedSetField = makeTypedSetField<CreateAgencyDto>(setFieldValue);
  const defaultValidationStepsValue = values.counsellorEmails.length
    ? "twoSteps"
    : "oneStep";
  const [validationSteps, setValidationSteps] = useState<
    "oneStep" | "twoSteps"
  >(defaultValidationStepsValue);

  return (
    <>
      <SimpleSelect
        {...formAgencyFieldsLabels.kind}
        id="agency-kind"
        name={getName("kind")}
        options={agencyListOfOptions.sort((a, b) =>
          a.label < b.label ? -1 : 0,
        )}
      />
      <TextInput
        {...formAgencyFieldsLabels.name}
        name={getName("name")}
        autoComplete="organization"
      />
      <AddressAutocomplete
        {...formAgencyFieldsLabels.address}
        initialSearchTerm={
          addressInitialValue && addressDtoToString(addressInitialValue)
        }
        setFormValue={({ position, address }) => {
          typedSetField("position")(position);
          typedSetField("address")(address);
        }}
      />
      <RadioGroup
        id="steps-for-validation"
        currentValue={validationSteps}
        setCurrentValue={setValidationSteps}
        groupLabel={formAgencyFieldsLabels.stepsForValidation.label}
        options={formAgencyFieldsLabels.stepsForValidation.options}
      />
      {validationSteps === "twoSteps" && (
        <FillableList
          {...formAgencyFieldsLabels.counsellorEmails}
          name="counsellor-emails"
          valuesInList={values.counsellorEmails}
          setValues={typedSetField("counsellorEmails")}
          validationSchema={zEmail}
        />
      )}

      <FillableList
        {...formAgencyFieldsLabels.validatorEmails}
        name="validator-emails"
        description={descriptionByValidationSteps[validationSteps]}
        valuesInList={values.validatorEmails}
        setValues={typedSetField("validatorEmails")}
        validationSchema={zEmail}
      />

      {values.kind !== "pole-emploi" && (
        <TextInput
          {...formAgencyFieldsLabels.questionnaireUrl}
          name={getName("questionnaireUrl")}
        />
      )}

      <TextInput
        {...formAgencyFieldsLabels.signature}
        name={getName("signature")}
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
  cci: "Chambres de Commerce et d'Industries",
  "structure-IAE": "Structure IAE",
  autre: "Autre",
};

export const agencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: agencyKindToLabel[agencyKind],
}));

type MakeTypedSetField = <T extends Record<string, unknown>>(
  setFieldValue: FormikHelpers<T>["setFieldValue"],
) => <K extends Exclude<keyof T, "id">>(
  fieldName: K,
) => (fieldValue: T[K]) => void;

export const makeTypedSetField: MakeTypedSetField =
  (setFieldValue) => (fieldName) => (fieldValue) =>
    setFieldValue(fieldName as string, fieldValue);
