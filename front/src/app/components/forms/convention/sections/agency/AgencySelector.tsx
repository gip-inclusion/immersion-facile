import { useField } from "formik";
import React, { useEffect, useState } from "react";
import {
  AgencyId,
  AgencyOption,
  ConventionDto,
  DepartmentCode,
  FederatedIdentity,
  InternshipKind,
  isPeConnectIdentity,
} from "shared";
import { PostcodeAutocomplete } from "src/app/components/forms/commons/PostcodeAutocomplete";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { useFederatedIdentity } from "src/app/hooks/federatedIdentity";
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
  const t = useConventionTextsFromFormikContext();
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode | null>(
    null,
  );
  const [agencies, setAgencies] = useState([
    {
      id: "",
      name: "Veuillez indiquer un code postal",
    },
  ]);
  const federatedIdentity = useFederatedIdentity();

  useEffect(() => {
    if (!departmentCode) return;

    setIsLoading(true);
    agenciesRetriever({
      internshipKind,
      shouldListAll,
      departmentCode,
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
  }, [departmentCode]);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <PostcodeAutocomplete
        label={t.agencySection.yourPostalcodeLabel}
        onFound={setDepartmentCode}
        disabled={disabled}
      />
      <AgencyDropdownListField
        isLoading={isLoading}
        loaded={loaded}
        disabled={disabled}
        name={name}
        value={value}
        onBlur={onBlur}
        agencies={agencies}
        departmentCode={departmentCode}
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
    : agencyGateway.listImmersionWithoutPeAgencies(departmentCode);
};
