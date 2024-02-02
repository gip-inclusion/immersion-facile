import Select, { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { keys, uniqBy } from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader } from "react-design-system";
import { useFormContext, useWatch } from "react-hook-form";
import {
  AgencyId,
  AgencyKind,
  AgencyOption,
  AllowedAgencyKindToAdd,
  ConventionReadDto,
  CreateAgencyDto,
  DepartmentCode,
  agencyKindToLabel,
  allAgencyKindsAllowedToAdd,
  departmentNameToDepartmentCode,
  fitForDelegationAgencyKind,
  sortByPropertyCaseInsensitive,
} from "shared";
import { FormFieldAttributes } from "src/app/contents/forms/types";
import { AgencyErrorText } from "../convention/sections/agency/AgencyErrorText";

type AgencySelectorProps = {
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
} & (
  | {
      shouldLockToPeAgencies: true;
      shouldFilterDelegationPrescriptionAgencyKind: false;
    }
  | {
      shouldLockToPeAgencies: false;
      shouldFilterDelegationPrescriptionAgencyKind: boolean;
    }
);

type AgencyKindForSelector = AllowedAgencyKindToAdd | "all";

type SupportedFormsDto = ConventionReadDto | CreateAgencyDto;

const getAgencyKindsInitialValue = (
  agencyKindRestrictions: Pick<
    AgencySelectorProps,
    "shouldFilterDelegationPrescriptionAgencyKind" | "shouldLockToPeAgencies"
  >,
): AllowedAgencyKindToAdd[] => {
  const {
    shouldFilterDelegationPrescriptionAgencyKind,
    shouldLockToPeAgencies,
  } = agencyKindRestrictions;
  if (shouldLockToPeAgencies) return ["pole-emploi"];
  if (shouldFilterDelegationPrescriptionAgencyKind)
    return fitForDelegationAgencyKind;
  return allAgencyKindsAllowedToAdd;
};

export const AgencySelector = ({
  shouldLockToPeAgencies,
  shouldFilterDelegationPrescriptionAgencyKind,
  shouldShowAgencyKindField,
  disabled,
  fields: { agencyDepartmentField, agencyKindField, agencyIdField },
  agencyDepartmentOptions,
  agenciesRetriever,
}: AgencySelectorProps) => {
  const {
    register,
    setValue,
    formState: { errors, touchedFields },
    control,
  } = useFormContext<SupportedFormsDto>();

  const initialAgencyKinds = getAgencyKindsInitialValue({
    shouldFilterDelegationPrescriptionAgencyKind,
    shouldLockToPeAgencies,
  });
  const [agencyKinds, setAgencyKinds] =
    useState<AllowedAgencyKindToAdd[]>(initialAgencyKinds);

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

  const agencyDepartment = useWatch({
    name: agencyDepartmentFieldName,
    control,
  }) as string;

  const agencyPlaceholder = getAgencyPlaceholder(
    agencyDepartment,
    agencies.length,
  );

  const agencyOptionsInSelector = agencyOptionsInSelectorFromAgencies(
    agencies,
    agencyKinds,
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

  const agencyKindFilter = (
    kind: AgencyKind,
  ): kind is AllowedAgencyKindToAdd => {
    if (shouldLockToPeAgencies) return kind === "pole-emploi";
    if (
      kind !== "immersion-facile" &&
      shouldFilterDelegationPrescriptionAgencyKind
    )
      return fitForDelegationAgencyKind.includes(kind);
    return kind !== "immersion-facile";
  };

  const agencyKindOptions: AgencyKindOptions = [
    ...((shouldLockToPeAgencies || shouldFilterDelegationPrescriptionAgencyKind
      ? []
      : [{ label: "Toutes", value: "all" }]) satisfies AgencyKindOptions),
    ...uniqBy((agencyOption) => agencyOption.kind, agencies)
      .map((agencyOption) => agencyOption.kind)
      .filter(agencyKindFilter)
      .map((agencyKind) => ({
        label: agencyKindToLabel[agencyKind],
        value: agencyKind,
      })),
  ];
  const agencyIdValue = useWatch({
    name: agencyIdFieldName,
    control,
  }) as AgencyId;

  const onAgencyDepartmentChange = useCallback(
    (department: string) => {
      setIsLoading(true);
      agenciesRetriever(department)
        .then((retrievedAgencies) => {
          setAgencies(sortByPropertyCaseInsensitive("name")(retrievedAgencies));
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
    },
    [agenciesRetriever],
  );

  const resetSelector = useCallback(() => {
    setValue(agencyDepartmentFieldName, "");
    setValue(agencyIdFieldName, "");
  }, [agencyDepartmentFieldName, agencyIdFieldName, setValue]);

  useEffect(() => {
    if (agencyDepartment) {
      onAgencyDepartmentChange(agencyDepartment);
    }
  }, [agencyDepartment, onAgencyDepartmentChange]);

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
            const department = event.currentTarget.value;
            setValue(agencyIdFieldName, "");
            setValue(agencyDepartmentFieldName, department);
          },
        }}
      />

      {shouldShowAgencyKindField && (
        <Select
          label={agencyKindField.label}
          hint={
            shouldLockToPeAgencies
              ? "Cette convention a été initié par un utilisateur connecté via PE Connect, vous ne pouvez choisir qu'une agence de rattachement de type France Travail (anciennement Pôle emploi)"
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
            value:
              agencyKinds.length === initialAgencyKinds.length
                ? "all"
                : agencyKinds[0],
            onChange: (event) => {
              if (event.currentTarget.value === "all")
                return setAgencyKinds(allAgencyKindsAllowedToAdd);
              return setAgencyKinds([event.currentTarget.value]);
            },
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
  agencyKinds: AllowedAgencyKindToAdd[],
) =>
  agencies
    .filter(
      ({ kind }) => kind !== "immersion-facile" && agencyKinds.includes(kind),
    )
    .map(({ id, name }) => ({
      label: name,
      value: id,
    }));
