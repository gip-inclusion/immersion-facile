import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import Select, { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { keys, uniqBy } from "ramda";
import {
  AgencyOption,
  ConventionReadDto,
  CreateAgencyDto,
  DepartmentCode,
  departmentNameToDepartmentCode,
  sortByPropertyCaseInsensitive,
} from "shared";
import { Loader } from "react-design-system";
import {
  agencyKindToLabel,
  AllowedAgencyKindToAdd,
} from "src/app/components/forms/agency/agencyKindToLabel";
import { FormFieldAttributes } from "src/app/contents/forms/types";
import { AgencyErrorText } from "../convention/sections/agency/AgencyErrorText";

type AgencySelectorProps = {
  shouldLockToPeAgencies: boolean;
  shouldShowAgencyKindField: boolean;
  fields: {
    agencyDepartmentField: FormFieldAttributes;
    agencyKindField: FormFieldAttributes;
    agencyIdField: FormFieldAttributes;
  };
  agencyDepartmentOptions: SelectProps.Option<string>[];
  agenciesRetriever: (
    departmentCode: DepartmentCode,
  ) => Promise<AgencyOption[]>;
  disabled?: boolean;
  defaultAgencyId?: string;
};
type AgencyKindForSelector = AllowedAgencyKindToAdd | "all";

type SupportedFormsDto = ConventionReadDto | CreateAgencyDto;

export const AgencySelector = ({
  shouldLockToPeAgencies,
  shouldShowAgencyKindField,
  disabled,
  fields: { agencyDepartmentField, agencyKindField, agencyIdField },
  agencyDepartmentOptions,
  agenciesRetriever,
  defaultAgencyId,
}: AgencySelectorProps) => {
  const {
    register,
    setValue,
    getValues,
    formState: { errors, touchedFields },
  } = useFormContext<SupportedFormsDto>();
  const [agencyKind, setAgencyKind] = useState<AgencyKindForSelector>("all");
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const agencyIdFieldName = useMemo(
    () => agencyIdField.name as keyof SupportedFormsDto,
    [agencyIdField.name],
  );
  const agencyDepartmentFieldName = useMemo(
    () => agencyDepartmentField.name as keyof SupportedFormsDto,
    [agencyDepartmentField.name],
  );

  const agencyDepartment = getValues(agencyDepartmentFieldName) as string;

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

  const [loadingError, setLoadingError] = useState(false);

  const error = errors[agencyIdFieldName];
  const touched = touchedFields[agencyIdFieldName];
  const userError = !!(touched && error);
  const showError: boolean = userError || loadingError;

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

  const onAgencyDepartmentChange = (department: string) => {
    setValue(agencyDepartmentFieldName, department);
    setIsLoading(true);
    agenciesRetriever(department)
      .then((retrievedAgencies) => {
        setAgencies(sortByPropertyCaseInsensitive("name")(retrievedAgencies));
        if (
          defaultAgencyId &&
          isDefaultAgencyOnAgenciesAndEnabled(
            disabled,
            defaultAgencyId,
            retrievedAgencies,
          )
        )
          setValue(agencyIdFieldName, defaultAgencyId);
        else setValue(agencyIdFieldName, "");
        setLoadingError(false);
      })
      .catch((e: any) => {
        //eslint-disable-next-line no-console
        console.log("AgencySelector", e);
        setAgencies([]);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const resetSelector = useCallback(() => {
    setValue(agencyDepartmentFieldName, "");
    setValue(agencyIdFieldName, "");
  }, [agencyDepartmentFieldName, agencyIdFieldName, setValue]);

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
          onChange: (event) =>
            onAgencyDepartmentChange(event.currentTarget.value),
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
    .filter(({ kind }) => agencyKind === "all" || kind === agencyKind)
    .map(({ id, name }) => ({
      label: name,
      value: id,
    }));

const isDefaultAgencyOnAgenciesAndEnabled = (
  disabled: boolean | undefined,
  defaultAgencyId: string,
  agencies: AgencyOption[],
) => !disabled && agencies.map((agency) => agency.id).includes(defaultAgencyId);
