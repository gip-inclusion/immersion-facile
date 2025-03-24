import { Input } from "@codegouvfr/react-dsfr/Input";

import { type ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  type AddressDto,
  type CreateAgencyDto,
  domElementIds,
  emailSchema,
} from "shared";
import {
  AddressAutocomplete,
  addressStringToFakeAddressAndPosition,
} from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";

type AgencyFormCommonFieldsProps = {
  addressInitialValue?: AddressDto;
  refersToOtherAgency: boolean;
  mode: "edit" | "create";
  disableAgencyName: boolean;
};

type ValidationSteps = "validatorsOnly" | "counsellorsAndValidators";

export const AgencyFormCommonFields = ({
  refersToOtherAgency,
  mode,
  disableAgencyName,
}: AgencyFormCommonFieldsProps) => {
  const { getValues, setValue, register, formState, watch } =
    useFormContext<CreateAgencyDto>();

  const formContents = getFormContents(formAgencyFieldsLabels).getFormFields();
  const getFieldError = makeFieldError(formState);

  const {
    updateSiret,
    siretErrorToDisplay,
    isFetchingSiret,
    establishmentInfos,
  } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });

  const formValues = getValues();
  const [validationSteps, setValidationSteps] = useState<ValidationSteps>(
    formValues.counsellorEmails.length || refersToOtherAgency
      ? "counsellorsAndValidators"
      : "validatorsOnly",
  );

  const shouldResetCounsellorEmails =
    validationSteps === "validatorsOnly" &&
    formValues.counsellorEmails.length > 0;
  if (shouldResetCounsellorEmails) setValue("counsellorEmails", []);

  useEffect(() => {
    if (!isFetchingSiret && establishmentInfos)
      setValue("name", establishmentInfos.businessName);
  }, [establishmentInfos, isFetchingSiret, setValue]);
  const valueFromStore = establishmentInfos
    ? {
        label: establishmentInfos.businessAddress,
        value: addressStringToFakeAddressAndPosition(
          establishmentInfos.businessAddress,
        ),
      }
    : undefined;
  return (
    <>
      <Input
        label={formContents.agencySiret.label}
        hintText={formContents.agencySiret.hintText}
        nativeInputProps={{
          ...formContents.agencySiret,
          ...register("agencySiret"),
          onChange: (event) => {
            updateSiret(event.target.value);
            setValue("agencySiret", event.target.value);
          },
          readOnly: isFetchingSiret,
        }}
        state={
          siretErrorToDisplay && formState.touchedFields.agencySiret
            ? "error"
            : "default"
        }
        stateRelatedMessage={
          formState.touchedFields.agencySiret && siretErrorToDisplay
            ? siretErrorToDisplay
            : ""
        }
      />
      <Input
        label={formContents.name.label}
        hintText={formContents.name.hintText}
        nativeInputProps={{
          ...register("name"),
          ...formContents.name,
        }}
        {...getFieldError("name")}
        disabled={disableAgencyName}
      />
      <AddressAutocomplete
        {...formContents.address}
        selectProps={{
          inputId: domElementIds.addAgency.addressAutocomplete,
        }}
        initialValue={
          formHasAddressValues(formValues)
            ? {
                address: formValues.address,
                position: formValues.position,
              }
            : valueFromStore?.value
        }
        onAddressSelected={(addressAndPosition) => {
          setValue("address", addressAndPosition.address);
          setValue("position", addressAndPosition.position);
          setValue("coveredDepartments", [
            addressAndPosition.address.departmentCode,
          ]);
        }}
        onAddressClear={() => {
          setValue("address", {
            streetNumberAndAddress: "",
            postcode: "",
            departmentCode: "",
            city: "",
          });
          setValue("position", {
            lat: 0,
            lon: 0,
          });
          setValue("coveredDepartments", []);
        }}
        disabled={isFetchingSiret}
        {...getFieldError("address")}
      />
      {!refersToOtherAgency && (
        <RadioGroup
          {...formContents.stepsForValidation}
          options={numberOfStepsOptions}
          currentValue={validationSteps}
          setCurrentValue={setValidationSteps}
          groupLabel={formContents.stepsForValidation.label}
          disabled={mode === "edit"}
        />
      )}
      {(validationSteps === "counsellorsAndValidators" ||
        refersToOtherAgency) && (
        <MultipleEmailsInput
          {...formContents.counsellorEmails}
          initialValue={formValues.counsellorEmails.join(", ")}
          valuesInList={watch("counsellorEmails")}
          setValues={(values) => setValue("counsellorEmails", values)}
          validationSchema={emailSchema}
          disabled={mode === "edit"}
        />
      )}
      {!refersToOtherAgency && (
        <MultipleEmailsInput
          {...formContents.validatorEmails}
          initialValue={formValues.validatorEmails.join(", ")}
          description={descriptionByValidationSteps[validationSteps]}
          valuesInList={watch("validatorEmails")}
          setValues={(values) => setValue("validatorEmails", values)}
          validationSchema={emailSchema}
          disabled={mode === "edit"}
        />
      )}
      <Input
        label={formContents.signature.label}
        hintText={formContents.signature.hintText}
        nativeInputProps={{
          ...register("signature"),
          ...formContents.signature,
        }}
        {...getFieldError("signature")}
      />
    </>
  );
};

const numberOfStepsOptions: { label: string; value: ValidationSteps }[] = [
  {
    label: "1: La convention est examinée et validée par la même personne",
    value: "validatorsOnly",
  },
  {
    label:
      "2: La convention est examinée par une personne puis validée par quelqu'un d'autre",
    value: "counsellorsAndValidators",
  },
];

const descriptionByValidationSteps: Record<ValidationSteps, ReactNode> = {
  validatorsOnly: formAgencyFieldsLabels.counsellorEmails.hintText,
  counsellorsAndValidators: formAgencyFieldsLabels.validatorEmails.hintText,
};

const formHasAddressValues = (formValues: CreateAgencyDto) => {
  return (
    formValues.address &&
    formValues.position &&
    formValues.position.lat !== 0 &&
    formValues.position.lon !== 0
  );
};
