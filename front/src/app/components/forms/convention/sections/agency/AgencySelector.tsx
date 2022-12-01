import { useField } from "formik";
import React, { useEffect, useState } from "react";
import type { ConventionDto } from "shared";
import { InternshipKind } from "shared";
import {
  AgencyId,
  AgencyOption,
  DepartmentCode,
  FederatedIdentity,
  isPeConnectIdentity,
} from "shared";
import { agencyGateway } from "src/config/dependencies";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { useConnectedWith } from "src/app/hooks/connectedWith";
import { PostcodeAutocomplete } from "src/app/components/forms/commons/PostcodeAutocomplete";
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
  const connectedWith = useConnectedWith();

  useEffect(() => {
    if (!departmentCode) return;

    setIsLoading(true);
    agenciesRetriever({
      internshipKind,
      shouldListAll,
      departmentCode,
      connectedWith,
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
  connectedWith,
}: {
  internshipKind: InternshipKind;
  departmentCode: DepartmentCode;
  shouldListAll: boolean;
  connectedWith: FederatedIdentity | null;
}): Promise<AgencyOption[]> => {
  if (internshipKind === "mini-stage-cci")
    return agencyGateway.listCciAgencies(departmentCode);
  if (shouldListAll)
    return agencyGateway.listAgenciesByDepartmentCode(departmentCode);
  return connectedWith && isPeConnectIdentity(connectedWith)
    ? agencyGateway.listPeAgencies(departmentCode)
    : agencyGateway.listAgenciesByDepartmentCode(departmentCode);
  // : agencyGateway.listNonPeAgencies(position);
  // -> for easy revert when new page is ready
};
