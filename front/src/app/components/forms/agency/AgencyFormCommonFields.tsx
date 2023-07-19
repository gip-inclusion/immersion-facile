import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import {
  AddressDto,
  addressDtoToString,
  agencyKindList,
  CreateAgencyDto,
  emailSchema,
} from "shared";
import {
  agencyKindToLabel,
  AllowedAgencyKindToAdd,
} from "src/app/components/forms/agency/agencyKindToLabel";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { UploadLogo } from "src/app/components/UploadLogo";
import {
  FormAgencyFieldsLabels,
  formAgencyFieldsLabels,
} from "src/app/contents/forms/agency/formAgency";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";

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
  oneStep: formAgencyFieldsLabels.counsellorEmails.hintText,
  twoSteps: formAgencyFieldsLabels.validatorEmails.hintText,
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
        hint={fieldsContent.kind.hintText}
        options={agencyListOfOptions.sort((a, b) =>
          a.label < b.label ? -1 : 0,
        )}
        placeholder={fieldsContent.kind.placeholder}
        nativeSelectProps={{
          ...fieldsContent.kind,
          ...register("kind"),
        }}
      />

      <Input
        label={fieldsContent.name.label}
        hintText={fieldsContent.name.hintText}
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
          validationSchema={emailSchema}
        />
      )}

      <MultipleEmailsInput
        {...fieldsContent.validatorEmails}
        initialValue={formValues.validatorEmails.join(", ")}
        description={descriptionByValidationSteps[validationSteps]}
        valuesInList={watch("validatorEmails")}
        setValues={(values) => setValue("validatorEmails", values)}
        validationSchema={emailSchema}
      />

      {formValues.kind !== "pole-emploi" && (
        <Input
          label={fieldsContent.questionnaireUrl.label}
          hintText={fieldsContent.questionnaireUrl.hintText}
          nativeInputProps={{
            ...register("questionnaireUrl"),
            ...fieldsContent.questionnaireUrl,
          }}
          {...getFieldError("questionnaireUrl")}
        />
      )}

      <Input
        label={fieldsContent.signature.label}
        hintText={fieldsContent.signature.hintText}
        nativeInputProps={{
          ...register("signature"),
          ...fieldsContent.signature,
        }}
        {...getFieldError("signature")}
      />

      <Input
        label={fieldsContent.agencySiret.label}
        hintText={fieldsContent.agencySiret.hintText}
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

  if (!enableLogoUpload.isActive) return null;
  return (
    <>
      <UploadLogo
        setFileUrl={(value) => setValue("logoUrl", value)}
        maxSize_Mo={2}
        {...formAgencyFieldsLabels.logoUrl}
        hint={fieldsContent.logoUrl.hintText}
      />
      {formValues.logoUrl && (
        <img src={formValues.logoUrl} alt="uploaded-logo" width="100px" />
      )}
    </>
  );
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
