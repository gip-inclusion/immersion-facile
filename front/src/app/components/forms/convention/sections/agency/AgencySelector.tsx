import Select, { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { keys, uniqBy } from "ramda";
import React, { useState } from "react";
import { Loader } from "react-design-system";
import {
  AgencyDto,
  AgencyOption,
  ConventionReadDto,
  CreateAgencyDto,
  departmentNameToDepartmentCode,
  miniStageRestrictedDepartments,
} from "shared";
import {
  AllowedAgencyKindToAdd,
  agencyKindToLabel,
} from "src/app/components/forms/agency/agencyKindToLabel";
import { FormFieldAttributes } from "src/app/contents/forms/types";
import { AgencyErrorText } from "./AgencyErrorText";
import { useFormContext } from "react-hook-form";

type AgencySelectorProps = {
  isLoading: boolean;
  showError: boolean;
  shouldLockToPeAgencies: boolean;
  shouldShowAgencyKindField: boolean;
  initialAgencies: AgencyOption[];
  disabled?: boolean;
  fields: {
    agencyDepartmentField: FormFieldAttributes;
    agencyKindField: FormFieldAttributes;
    agencyIdField: FormFieldAttributes;
  };
  initialAgencyDepartment: string;
  agencyDepartmentOptions: SelectProps.Option<string>[];
};
type AgencyKindForSelector = AllowedAgencyKindToAdd | "all";

type SupportedFormsDto = ConventionReadDto | CreateAgencyDto;

export const AgencySelector = ({
  isLoading,
  showError,
  shouldLockToPeAgencies,
  shouldShowAgencyKindField,
  initialAgencies,
  disabled,
  fields: { agencyDepartmentField, agencyKindField, agencyIdField },
  initialAgencyDepartment,
  agencyDepartmentOptions,
}: AgencySelectorProps) => {
  const [agencyKind, setAgencyKind] = useState<AgencyKindForSelector>("all");
  const [agencies, setAgencies] = useState<AgencyOption[]>(initialAgencies);
  const [agencyDepartment, setAgencyDepartment] = useState<string>(
    initialAgencyDepartment,
  );
  const agencyPlaceholder = getAgencyPlaceholder(
    agencyDepartment,
    agencies.length,
  );

  const agencyOptionsInSelector = agencyOptionsInSelectorFromAgencies(
    agencies,
    agencyKind,
  );
  const isAgencySelectionDisabled =
    disabled ||
    isLoading ||
    !agencyDepartment ||
    agencyOptionsInSelector.length === 0;

  type AgencyKindOptions = {
    label: string;
    value: AgencyKindForSelector;
  }[];

  const {
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<SupportedFormsDto>();

  const agencyIdFieldName = agencyIdField.name as Pick<SupportedFormsDto, "">;
  const agencyDepartmentFieldName =
    agencyDepartmentField.name as keyof SupportedFormsDto;

  const agencyKindOptions: AgencyKindOptions = [
    ...((shouldLockToPeAgencies
      ? []
      : [{ label: "Toutes", value: "all" }]) satisfies AgencyKindOptions),
    ...uniqBy((agencyOption) => agencyOption.kind, agencies)
      .map((agencyOption) => agencyOption.kind)
      .filter((kind): kind is AllowedAgencyKindToAdd =>
        shouldLockToPeAgencies
          ? kind === "pole-emploi"
          : kind !== "immersion-facile",
      )
      .map((agencyKind) => ({
        label: agencyKindToLabel[agencyKind],
        value: agencyKind,
      })),
  ];

  if (shouldLockToPeAgencies && agencyKind !== "pole-emploi") {
    setAgencyKind("pole-emploi");
  }
  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <Select
        label={agencyDepartmentField.label}
        hint={agencyDepartmentField.hintText}
        options={agencyDepartmentOptions}
        placeholder={agencyDepartmentField.placeholder}
        nativeSelectProps={{
          ...agencyDepartmentField,
          value: agencyDepartment as string,
          onChange: (event) =>
            setValue(agencyDepartmentFieldName, event.currentTarget.value),
        }}
      />

      {shouldShowAgencyKindField && (
        <Select
          label={agencyKindField.label}
          hint={
            shouldLockToPeAgencies
              ? "Cette convention a été initié par un utilisateur connecté via PE Connect, vous ne pouvez choisir qu'une agence de rattachement de type Pole emploi"
              : agencyKindField.hintText
          }
          options={agencyKindOptions}
          placeholder={
            agencyKindOptions.length === 0
              ? agencyPlaceholder
              : agencyDepartmentField.placeholder
          }
          disabled={agencyKindOptions.length === 0 || shouldLockToPeAgencies}
          nativeSelectProps={{
            ...agencyKindField,
            value: agencyKind,
            onChange: (event) => setAgencyKind(event.currentTarget.value),
          }}
        />
      )}

      <Select
        disabled={isAgencySelectionDisabled}
        label={agencyIdField.label}
        hint={agencyIdField.hintText}
        options={agencyOptionsInSelector}
        placeholder={agencyPlaceholder}
        nativeSelectProps={{
          ...agencyIdField,
          ...register(agencyIdFieldName),
          value: getValues(agencyIdFieldName),
        }}
      />
      {showError && (
        <AgencyErrorText
          loadingError={loadingError}
          userError={userError ? "Veuillez sélectionner une structure" : ""} // @TODO userError.message
          error={error?.message}
        />
      )}
      {isLoading && <Loader />}
    </div>
  );
};

export const departmentOptions = keys(departmentNameToDepartmentCode).map(
  (departmentName: string): SelectProps.Option<string> => ({
    label: `${departmentNameToDepartmentCode[departmentName]} - ${departmentName}`,
    value: departmentNameToDepartmentCode[departmentName],
  }),
);

const getAgencyPlaceholder = (
  agencyDepartment: string,
  numberOfAgencies: number,
) => {
  if (!agencyDepartment) return "Veuillez sélectionner un département";
  if (numberOfAgencies === 0) return "Aucune agence dans ce département";
  return "Veuillez sélectionner une structure";
};

const agencyOptionsInSelectorFromAgencies = (
  agencies: AgencyOption[],
  agencyKind: AgencyKindForSelector,
) =>
  agencies
    .filter(({ kind }) => (agencyKind === "all" ? true : kind === agencyKind))
    .map(({ id, name }) => ({
      label: name,
      value: id,
    }));
