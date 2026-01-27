import Select, { type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { keys, uniq } from "ramda";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader } from "react-design-system";
import { useFormContext, useWatch } from "react-hook-form";
import {
  type AgencyId,
  type AgencyKind,
  type AgencyOption,
  type AllowedAgencyKindToAdd,
  agencyKindToLabel,
  allAgencyKindsAllowedToAdd,
  type ConventionReadDto,
  type CreateAgencyDto,
  type DepartmentCode,
  departmentNameToDepartmentCode,
  fitForDelegationAgencyKind,
  orderedAgencyKindList,
} from "shared";
import type { FormFieldAttributes } from "src/app/contents/forms/types";
import { AgencyErrorText } from "../convention/sections/agency/AgencyErrorText";

type AgencySelectorProps = {
  shouldShowAgencyKindField: boolean;
  fields: {
    agencyDepartmentField: FormFieldAttributes;
    agencyKindField: FormFieldAttributes;
    agencyIdField: FormFieldAttributes;
  };
  agencyDepartmentOptions: SelectProps.Option<string>[];
  onDepartmentCodeChangedMemoized: (departmentCode: DepartmentCode) => void;
  agencyOptions: AgencyOption[];
  disabled?: boolean;
  isLoading: boolean;
  isFetchAgencyOptionsError: boolean;
  shouldFilterDelegationPrescriptionAgencyKind: boolean;
};

export const allAgencyKindsValue = "all" as const;
type AgencyKindForSelector =
  | AllowedAgencyKindToAdd
  | typeof allAgencyKindsValue;

export const isAllAgencyKinds = (
  value: unknown,
): value is typeof allAgencyKindsValue => value === allAgencyKindsValue;

type SupportedFormsDto = ConventionReadDto | CreateAgencyDto;

const getAgencyKindsInitialValue = (
  agencyKindRestrictions: Pick<
    AgencySelectorProps,
    "shouldFilterDelegationPrescriptionAgencyKind"
  >,
): AllowedAgencyKindToAdd[] => {
  const { shouldFilterDelegationPrescriptionAgencyKind } =
    agencyKindRestrictions;
  if (shouldFilterDelegationPrescriptionAgencyKind)
    return fitForDelegationAgencyKind;
  return allAgencyKindsAllowedToAdd;
};

export const AgencySelector = ({
  shouldFilterDelegationPrescriptionAgencyKind,
  shouldShowAgencyKindField,
  disabled,
  fields: { agencyDepartmentField, agencyKindField, agencyIdField },
  agencyDepartmentOptions,
  onDepartmentCodeChangedMemoized,
  agencyOptions,
  isLoading,
  isFetchAgencyOptionsError,
}: AgencySelectorProps) => {
  const {
    register,
    setValue,
    formState: { errors, touchedFields },
    control,
  } = useFormContext<SupportedFormsDto>();

  const initialAgencyKinds = getAgencyKindsInitialValue({
    shouldFilterDelegationPrescriptionAgencyKind,
  });
  const [allowedAgencyKinds, setAllowedAgencyKinds] =
    useState<AllowedAgencyKindToAdd[]>(initialAgencyKinds);

  const agencyIdFieldName = useMemo(
    () => agencyIdField.name as keyof SupportedFormsDto,
    [agencyIdField.name],
  );
  const agencyDepartmentFieldName = useMemo(
    () => agencyDepartmentField.name as keyof SupportedFormsDto,
    [agencyDepartmentField.name],
  );

  const agencyKindFieldName = useMemo(
    () => agencyKindField.name as keyof SupportedFormsDto,
    [agencyKindField.name],
  );

  const agencyDepartment = useWatch({
    name: agencyDepartmentFieldName,
    control,
  }) as string;

  const agencyPlaceholder = getAgencyPlaceholder(
    agencyDepartment,
    agencyOptions.length,
  );

  const agencyOptionsInSelector = agencyOptionsInSelectorFromAgencyOptions(
    agencyOptions,
    allowedAgencyKinds,
  );
  const isAgencySelectionDisabled =
    disabled ||
    isLoading ||
    !agencyDepartment ||
    agencyOptionsInSelector.length === 0;

  const error = errors[agencyIdFieldName];
  const touched = touchedFields[agencyIdFieldName];
  const userError = !!(touched && error);
  const showError: boolean = userError || isFetchAgencyOptionsError;

  const agencyKindOptions = makeAgencyKindOptions(
    agencyOptions,
    shouldFilterDelegationPrescriptionAgencyKind,
  );

  const agencyIdValue = useWatch({
    name: agencyIdFieldName,
    control,
  }) as AgencyId;
  const resetSelector = useCallback(() => {
    setValue(agencyDepartmentFieldName, "");
    setValue(agencyIdFieldName, "");
  }, [agencyDepartmentFieldName, agencyIdFieldName, setValue]);

  useEffect(() => {
    if (agencyDepartment) {
      onDepartmentCodeChangedMemoized(agencyDepartment);
    }
  }, [agencyDepartment, onDepartmentCodeChangedMemoized]);

  useEffect(
    () => () => {
      resetSelector();
    },
    [resetSelector],
  );

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
          ...register(agencyDepartmentFieldName),
          onChange: (event) => {
            setValue(agencyDepartmentFieldName, event.currentTarget.value);
            setValue(agencyIdFieldName, "");
          },
        }}
      />

      {shouldShowAgencyKindField && (
        <Select
          label={agencyKindField.label}
          hint={agencyKindField.hintText}
          options={agencyKindOptions}
          placeholder={
            agencyKindOptions.length === 0
              ? agencyPlaceholder
              : agencyKindField.placeholder
          }
          disabled={agencyKindOptions.length === 0}
          nativeSelectProps={{
            ...agencyKindField,
            ...register(agencyKindFieldName),
            onChange: (event) =>
              setAllowedAgencyKinds(
                event.currentTarget.value === "all"
                  ? allAgencyKindsAllowedToAdd
                  : [event.currentTarget.value],
              ),
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
          value: agencyIdValue,
        }}
      />
      {showError && (
        <AgencyErrorText
          isFetchAgencyOptionsError={isFetchAgencyOptionsError}
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

const agencyOptionsInSelectorFromAgencyOptions = (
  agencies: AgencyOption[],
  agencyKinds: AllowedAgencyKindToAdd[],
) =>
  agencies
    .filter(
      ({ kind }) =>
        kind !== "immersion-facile" &&
        kind !== "prepa-apprentissage" &&
        agencyKinds.includes(kind),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ id, name }) => ({
      label: name,
      value: id,
    }));

type AgencyKindOptions = {
  label: string;
  value: AgencyKindForSelector;
}[];

const makeAgencyKindOptions = (
  agencyOptions: AgencyOption[],
  shouldFilterDelegationPrescriptionAgencyKind: boolean,
): AgencyKindOptions => {
  const isAllowedAgencyKindFilter = (
    kind: AgencyKind,
  ): kind is AllowedAgencyKindToAdd => {
    if (
      kind !== "immersion-facile" &&
      kind !== "prepa-apprentissage" &&
      shouldFilterDelegationPrescriptionAgencyKind
    )
      return fitForDelegationAgencyKind.includes(kind);
    return kind !== "immersion-facile" && kind !== "prepa-apprentissage";
  };

  const availableKinds = uniq(agencyOptions.map(({ kind }) => kind))
    .filter(isAllowedAgencyKindFilter)
    .map((agencyKind) => ({
      label: agencyKindToLabel[agencyKind],
      value: agencyKind,
    }));

  const sortedKinds = [...availableKinds].sort(
    (a, b) =>
      orderedAgencyKindList.findIndex((kind) => kind === a.value) -
      orderedAgencyKindList.findIndex((kind) => kind === b.value),
  );

  const optionalAllKindOption: AgencyKindOptions =
    shouldFilterDelegationPrescriptionAgencyKind
      ? []
      : [{ label: "Toutes", value: allAgencyKindsValue }];

  return [...optionalAllKindOption, ...sortedKinds];
};
