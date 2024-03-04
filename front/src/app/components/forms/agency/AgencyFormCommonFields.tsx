import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import React, { useEffect, useState } from "react";
import { LinkHome } from "react-design-system";
import { useFormContext } from "react-hook-form";
import {
  AddressDto,
  CreateAgencyDto,
  addressDtoToString,
  domElementIds,
  emailSchema,
} from "shared";
import { UploadFile } from "src/app/components/UploadFile";
import { agencyListOfOptions } from "src/app/components/forms/agency/agencyKindToLabel";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import {
  FormAgencyFieldsLabels,
  formAgencyFieldsLabels,
} from "src/app/contents/forms/agency/formAgency";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { routes } from "src/app/routes/routes";

type AgencyFormCommonFieldsProps = {
  addressInitialValue?: AddressDto;
  refersToOtherAgency: boolean;
};

type ValidationSteps = "validatorsOnly" | "counsellorsAndValidators";

export const AgencyFormCommonFields = ({
  addressInitialValue,
  refersToOtherAgency,
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

  return (
    <>
      <Select
        label={formContents.kind.label}
        hint={formContents.kind.hintText}
        options={agencyListOfOptions.sort((a, b) =>
          a.label < b.label ? -1 : 0,
        )}
        placeholder={formContents.kind.placeholder}
        nativeSelectProps={{
          ...formContents.kind,
          ...register("kind"),
        }}
        state={watch("kind") === "pole-emploi" ? "error" : "default"}
        stateRelatedMessage={
          watch("kind") === "pole-emploi" ? agencyErrorMessage : undefined
        }
      />
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
        disabled={isFetchingSiret}
      />
      <Input
        label={formContents.name.label}
        hintText={formContents.name.hintText}
        nativeInputProps={{
          ...register("name"),
          ...formContents.name,
        }}
        {...getFieldError("name")}
      />
      <AddressAutocomplete
        {...formContents.address}
        initialSearchTerm={
          establishmentInfos
            ? establishmentInfos.businessAddress
            : addressInitialValue && addressDtoToString(addressInitialValue)
        }
        setFormValue={({ position, address }) => {
          setValue("position", position);
          setValue("address", address);
          setValue("coveredDepartments", [address.departmentCode]);
        }}
        id={domElementIds.addAgency.addressAutocomplete}
        disabled={isFetchingSiret}
        useFirstAddressOnInitialSearchTerm
      />
      {!refersToOtherAgency && (
        <RadioGroup
          {...formContents.stepsForValidation}
          options={numberOfStepsOptions}
          currentValue={validationSteps}
          setCurrentValue={setValidationSteps}
          groupLabel={formContents.stepsForValidation.label}
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
        />
      )}
      {formValues.kind !== "pole-emploi" && (
        <Input
          label={formContents.questionnaireUrl.label}
          hintText={formContents.questionnaireUrl.hintText}
          nativeInputProps={{
            ...formContents.questionnaireUrl,
            ...register("questionnaireUrl", {
              setValueAs: (value: string | null) =>
                value === "" ? null : value,
            }),
          }}
          {...getFieldError("questionnaireUrl")}
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

const agencyErrorMessage = (
  <span>
    Attention, toutes les agences France Travail ont déjà été ajoutées par notre
    équipe sur Immersion Facilitée.{" "}
    <LinkHome {...routes.agencyDashboard().link}>
      Accéder à votre espace prescripteur.
    </LinkHome>
  </span>
);

const numberOfStepsOptions: { label: string; value: ValidationSteps }[] = [
  {
    label: "1: La convention est examinée et validée par la même personne",
    value: "validatorsOnly",
  },
  {
    label:
      "2: La convention est examinée par une personne puis validée par quelqu’un d’autre",
    value: "counsellorsAndValidators",
  },
];

const descriptionByValidationSteps: Record<ValidationSteps, React.ReactNode> = {
  validatorsOnly: formAgencyFieldsLabels.counsellorEmails.hintText,
  counsellorsAndValidators: formAgencyFieldsLabels.validatorEmails.hintText,
};

export const AgencyLogoUpload = () => {
  const { getValues, setValue } = useFormContext<CreateAgencyDto>();
  const { getFormFields } = getFormContents(formAgencyFieldsLabels);
  const fieldsContent: FormAgencyFieldsLabels = getFormFields();
  const formValues = getValues();

  return (
    <>
      <UploadFile
        setFileUrl={(value) => setValue("logoUrl", value)}
        maxSize_Mo={2}
        {...formAgencyFieldsLabels.logoUrl}
        hint={fieldsContent.logoUrl.hintText}
        renameFileToId={true}
      />
      {formValues.logoUrl && (
        <img src={formValues.logoUrl} alt="uploaded-logo" width="100px" />
      )}
    </>
  );
};
