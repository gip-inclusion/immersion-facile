import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Select, type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import {
  AgencyOption,
  ConventionReadDto,
  DepartmentCode,
  departmentNameToDepartmentCode,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
  keys,
  miniStageRestrictedDepartments,
  sortByProperty,
} from "shared";
import { Loader } from "react-design-system";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyGateway } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { AgencyErrorText } from "./AgencyErrorText";

type AgencySelectorProps = {
  internshipKind: InternshipKind;
  disabled?: boolean;
  defaultAgencyId?: string;
  shouldListAll: boolean;
};

export const AgencySelector = ({
  internshipKind,
  disabled,
  defaultAgencyId,
  shouldListAll,
}: AgencySelectorProps) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(internshipKind),
  );
  const { agencyId: agencyIdField, agencyDepartment: agencyDepartmentField } =
    getFormFields();
  const {
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<ConventionReadDto>();
  const agencyDepartmentStored = useAppSelector(
    conventionSelectors.agencyDepartment,
  );
  const agencyDepartment = getValues("agencyDepartment");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const dispatch = useDispatch();
  const [agencies, setAgencies] = useState<AgencyOption[]>([
    {
      id: "",
      name: agencyDepartmentField.placeholder ?? "",
      kind: "autre",
    },
  ]);
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const agencyIdName = agencyIdField.name as keyof ConventionReadDto;
  const agencyDepartmentName =
    agencyDepartmentField.name as keyof ConventionReadDto;

  useEffect(() => {
    if (!agencyDepartment) return;
    dispatch(
      conventionSlice.actions.agencyDepartementChangeRequested(
        agencyDepartment,
      ),
    );
    setIsLoading(true);
    agenciesRetriever({
      internshipKind,
      shouldListAll,
      departmentCode: agencyDepartment,
      federatedIdentity,
    })
      .then((retrievedAgencies) => {
        setAgencies(sortByProperty("name")(retrievedAgencies));
        if (
          defaultAgencyId &&
          isDefaultAgencyOnAgenciesAndEnabled(
            disabled,
            defaultAgencyId,
            retrievedAgencies,
          )
        )
          setValue(agencyIdName, defaultAgencyId);
        else setValue(agencyIdName, "");
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
  }, [agencyDepartment]);

  useEffect(() => {
    if (agencyDepartmentStored) {
      setValue(agencyDepartmentName, agencyDepartmentStored);
    }
  }, [agencyDepartmentStored]);

  const error = errors[agencyIdName];
  const touched = touchedFields[agencyIdName];
  const userError = touched && error;
  const showError = userError || loadingError;
  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <Select
        label={agencyDepartmentField.label}
        hint={agencyDepartmentField.hintText}
        options={
          internshipKind === "immersion"
            ? departmentOptions
            : departmentOptions.filter((department) =>
                miniStageRestrictedDepartments.includes(department.value),
              )
        }
        placeholder={agencyDepartmentField.placeholder}
        nativeSelectProps={{
          ...agencyDepartmentField,
          value: agencyDepartment as string,
          onChange: (event) =>
            setValue(agencyDepartmentName, event.currentTarget.value),
        }}
      />

      <Select
        label={agencyIdField.label}
        hint={agencyIdField.hintText}
        options={agencies.map(({ id, name }) => ({ label: name, value: id }))}
        placeholder={
          agencyDepartment
            ? "Veuillez sélectionner une structure"
            : "Veuillez sélectionner un département"
        }
        nativeSelectProps={{
          ...agencyIdField,
          ...register(agencyIdName),
          value: getValues(agencyIdName) as string,
          disabled: disabled || isLoading || !agencyDepartment,
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

const departmentOptions = keys(departmentNameToDepartmentCode).map(
  (departmentName: string): SelectProps.Option<string> => ({
    label: `${departmentNameToDepartmentCode[departmentName]} - ${departmentName}`,
    value: departmentNameToDepartmentCode[departmentName],
  }),
);

const isDefaultAgencyOnAgenciesAndEnabled = (
  disabled: boolean | undefined,
  defaultAgencyId: string,
  agencies: AgencyOption[],
) => !disabled && agencies.map((agency) => agency.id).includes(defaultAgencyId);

const agenciesRetriever = ({
  internshipKind,
  departmentCode,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  departmentCode: DepartmentCode;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): Promise<AgencyOption[]> => {
  if (internshipKind === "mini-stage-cci")
    return agencyGateway.listMiniStageAgencies(departmentCode);
  if (shouldListAll) return agencyGateway.listImmersionAgencies(departmentCode);
  return federatedIdentity && isPeConnectIdentity(federatedIdentity)
    ? agencyGateway.listImmersionOnlyPeAgencies(departmentCode)
    : agencyGateway.listImmersionAgencies(departmentCode);
};
