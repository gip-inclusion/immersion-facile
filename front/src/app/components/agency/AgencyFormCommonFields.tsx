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
import {
  FormAgencyFieldsLabels,
  formAgencyFieldsLabels,
} from "src/app/contents/forms/agency/formAgency";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { FillableList } from "src/app/components/forms/commons/FillableList";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { Select } from "react-design-system";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";

type AgencyFormCommonFieldsProps = {
  addressInitialValue?: AddressDto;
};

type ValidationSteps = "oneStep" | "twoSteps";

const numberOfStepsOptions: { label: string; value: ValidationSteps }[] = [
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

const descriptionByValidationSteps = {
  oneStep: formAgencyFieldsLabels.counsellorEmails.description,
  twoSteps: formAgencyFieldsLabels.validatorEmails.description,
};

export const AgencyFormCommonFields = ({
  addressInitialValue,
}: AgencyFormCommonFieldsProps) => {
  const { getValues, setValue, register, formState, watch } =
    useFormContext<CreateAgencyDto>();
  const formValues = getValues();
  const defaultValidationStepsValue = formValues.counsellorEmails.length
    ? "twoSteps"
    : "oneStep";
  const [validationSteps, setValidationSteps] = useState<
    "oneStep" | "twoSteps"
  >(defaultValidationStepsValue);
  const { getFormFields } = useFormContents(formAgencyFieldsLabels);
  const fieldsContent = getFormFields();
  const getFieldError = makeFieldError(formState);

  return (
    <>
      <Select
        id={fieldsContent.kind.id}
        label={fieldsContent.kind.label}
        placeholder={fieldsContent.kind.placeholder}
        options={agencyListOfOptions.sort((a, b) =>
          a.label < b.label ? -1 : 0,
        )}
        name={register("kind").name}
        onChange={(e) => setValue("kind", e.currentTarget.value as AgencyKind)}
        value={watch("kind")}
      />

      <Input
        label={fieldsContent.name.label}
        nativeInputProps={{
          ...register("name"),
          ...fieldsContent.name,
        }}
        {...getFieldError("name")}
      />
      <AddressAutocomplete
        {...fieldsContent.address}
        initialSearchTerm={
          addressInitialValue && addressDtoToString(addressInitialValue)
        }
        setFormValue={({ position, address }) => {
          setValue("position", position);
          setValue("address", address);
        }}
      />
      <RadioGroup
        {...fieldsContent.stepsForValidation}
        options={numberOfStepsOptions}
        currentValue={validationSteps}
        setCurrentValue={setValidationSteps}
        groupLabel={fieldsContent.stepsForValidation.label}
      />
      {validationSteps === "twoSteps" && (
        <FillableList
          {...fieldsContent.counsellorEmails}
          valuesInList={watch("counsellorEmails")}
          setValues={(values) => setValue("counsellorEmails", values)}
          validationSchema={zEmail}
        />
      )}

      <FillableList
        {...fieldsContent.validatorEmails}
        description={descriptionByValidationSteps[validationSteps]}
        valuesInList={watch("validatorEmails")}
        setValues={(values) => setValue("validatorEmails", values)}
        validationSchema={zEmail}
      />

      {formValues.kind !== "pole-emploi" && (
        <Input
          label={fieldsContent.questionnaireUrl.label}
          nativeInputProps={{
            ...register("questionnaireUrl"),
            ...fieldsContent.questionnaireUrl,
          }}
          {...getFieldError("questionnaireUrl")}
        />
      )}

      <Input
        label={fieldsContent.signature.label}
        nativeInputProps={{
          ...register("signature"),
          ...fieldsContent.signature,
        }}
        {...getFieldError("signature")}
      />
    </>
  );
};

export const AgencyLogoUpload = () => {
  const { getValues, setValue } = useFormContext<CreateAgencyDto>();
  const { enableLogoUpload } = useFeatureFlags();
  const { getFormFields } = useFormContents(formAgencyFieldsLabels);
  const fieldsContent: FormAgencyFieldsLabels = getFormFields();
  const formValues = getValues();

  if (!enableLogoUpload) return null;
  return (
    <>
      <UploadLogo
        setFileUrl={(value) => setValue("logoUrl", value)}
        maxSize_Mo={2}
        {...formAgencyFieldsLabels.logoUrl}
        hint={fieldsContent.logoUrl.description}
      />
      {formValues.logoUrl && (
        <img src={formValues.logoUrl} alt="uploaded-logo" width="100px" />
      )}
    </>
  );
};

type AllowedAgencyKindToAdd = Exclude<AgencyKind, "immersion-facile">;

const agencyKindToLabel: Record<AllowedAgencyKindToAdd, string> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pole Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  cci: "Chambres de Commerce et d'Industries",
  "structure-IAE": "Structure IAE",
  autre: "Autre",
};

export const agencyListOfOptions = agencyKindList
  .filter(
    (agencyKind): agencyKind is AllowedAgencyKindToAdd =>
      agencyKind !== "immersion-facile",
  )
  .map((agencyKind) => ({
    value: agencyKind,
    label: agencyKindToLabel[agencyKind],
  }));
