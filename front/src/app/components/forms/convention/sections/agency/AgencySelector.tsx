import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { Select } from "react-design-system";
import {
  AgencyId,
  AgencyOption,
  DepartmentCode,
  departmentNameToDepartmentCode,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
  keys,
} from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFederatedIdentity } from "src/app/hooks/federatedIdentity";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { agencyGateway } from "src/config/dependencies";
import { AgencyDropdownListField } from "./AgencyDropdownListField";
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
  const { agencyId: agencyIdField, departmentCode: departmentCodeField } =
    getFormFields();
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>(agencyIdField.name || "agencyId");
  const [
    { value: departmentCodeValue },
    _,
    { setValue: setDepartmentCodeValue },
  ] = useField<DepartmentCode | null>(
    departmentCodeField.name || "departmentCode",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  const [agencies, setAgencies] = useState([
    {
      id: "",
      name: "Veuillez indiquer un code postal",
    },
  ]);
  const federatedIdentity = useFederatedIdentity();

  useEffect(() => {
    if (!departmentCodeValue) return;

    setIsLoading(true);
    agenciesRetriever({
      internshipKind,
      shouldListAll,
      departmentCode: departmentCodeValue,
      federatedIdentity,
    })
      .then((agencies: any) => {
        setAgencies([
          {
            id: "",
            name: "",
          },
          ...agencies,
        ]);
        if (
          defaultAgencyId &&
          isDefaultAgencyOnAgenciesAndEnabled(
            disabled,
            defaultAgencyId,
            agencies,
          )
        )
          setValue(defaultAgencyId);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e: any) => {
        //eslint-disable-next-line no-console
        console.log("AgencySelector", e);
        setAgencies([]);
        setLoaded(false);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [departmentCodeValue]);

  const userError = touched && error;
  const showError = userError || loadingError;
  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <Select
        options={departmentOptions}
        {...departmentCodeField}
        onChange={(event) => setDepartmentCodeValue(event.currentTarget.value)}
        value={departmentCodeValue as string}
      />

      <AgencyDropdownListField
        {...agencyIdField}
        name={agencyIdField.name || "agencyId"}
        isLoading={isLoading}
        loaded={loaded}
        disabled={disabled}
        value={value}
        onBlur={onBlur}
        agencies={agencies}
        departmentCode={departmentCodeValue}
        setValue={setValue}
      />
      {showError && (
        <AgencyErrorText
          loadingError={loadingError}
          userError={userError}
          error={error}
        />
      )}
    </div>
  );
};

type DepartmentOption = {
  label: string;
  value: string;
}; //satisfies SelectOption

const departmentOptions = keys(departmentNameToDepartmentCode).map(
  (departmentName: string): DepartmentOption => ({
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
