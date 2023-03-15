import React, { useEffect, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useFormContext } from "react-hook-form";
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
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";

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

  useEffect(() => {
    if (validationSteps === "oneStep") setValue("counsellorEmails", []);
  }, [validationSteps]);

  const { getFormFields } = useFormContents(formAgencyFieldsLabels);
  const fieldsContent = getFormFields();
  const getFieldError = makeFieldError(formState);

  return (
    <>
      <Select
        label={fieldsContent.kind.label}
        options={agencyListOfOptions.sort((a, b) =>
          a.label < b.label ? -1 : 0,
        )}
        placeholder={fieldsContent.kind.placeholder}
        nativeSelectProps={{
          id: fieldsContent.kind.id,
          name: register("kind").name,
          onChange: (e) =>
            setValue("kind", e.currentTarget.value as AgencyKind),
        }}
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
        <MultipleEmailsInput
          {...fieldsContent.counsellorEmails}
          initialValue={formValues.counsellorEmails.join(", ")}
          valuesInList={watch("counsellorEmails")}
          setValues={(values) => setValue("counsellorEmails", values)}
          validationSchema={zEmail}
        />
      )}

      <MultipleEmailsInput
        {...fieldsContent.validatorEmails}
        initialValue={formValues.validatorEmails.join(", ")}
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

      <Input
        label={fieldsContent.agencySiret.label}
        nativeInputProps={{
          ...register("agencySiret"),
          placeholder: "n° de siret",
        }}
        {...getFieldError("agencySiret")}
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
  cci: "Chambres de Commerce et d'Industrie",
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
