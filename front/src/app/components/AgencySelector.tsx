import { CircularProgress } from "@mui/material";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import type { ConventionDto } from "shared";
import {
  AgencyId,
  AgencyIdAndName,
  DepartmentCode,
  FederatedIdentity,
  isPeConnectIdentity,
} from "shared";
import { Agencies } from "src/app/components/Agency";
import { agencyGateway } from "src/app/config/dependencies";
import { useConnectedWith } from "src/hooks/connectedWith";
import { PostcodeAutocomplete } from "src/uiComponents/form/PostcodeAutocomplete";

type AgencySelectorProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  defaultAgencyId?: string;
  shouldListAll: boolean;
};

export const AgencySelector = ({
  label,
  description,
  disabled,
  defaultAgencyId,
  shouldListAll,
}: AgencySelectorProps) => {
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode | null>(
    null,
  );
  const [agencies, setAgencies] = useState([placeholderAgency]);
  const connectedWith = useConnectedWith();

  useEffect(() => {
    if (!departmentCode) return;

    setIsLoading(true);
    agenciesRetriever({
      shouldListAll,
      departmentCode,
      connectedWith,
    })
      .then((agencies) => {
        setAgencies([emptyAgency, ...agencies]);
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
      .catch((e) => {
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
      <PostcodeAutocomplete onFound={setDepartmentCode} disabled={disabled} />
      <label className="fr-label pt-4" htmlFor={name}>
        {label}
      </label>
      {description && <span className="fr-hint-text">{description}</span>}
      <div className="flex">
        {isLoading && (
          <div className="flex justify-center items-center pr-2">
            <CircularProgress size="20px" />{" "}
          </div>
        )}
        <select
          className="fr-select"
          id={name}
          name={name}
          value={value}
          onChange={(evt) => {
            setValue(evt.currentTarget.value);
          }}
          onBlur={onBlur}
          aria-describedby={`agency-code-{name}-error-desc-error`}
          disabled={disabled || !loaded || !departmentCode}
        >
          <Agencies agencies={agencies} />
        </select>
      </div>
      {showError && (
        <p id={`agency-code-{name}-error-desc-error`} className="fr-error-text">
          {loadingError
            ? "Erreur de chargement de la liste. Veuillez réessayer plus tard."
            : ""}
          {userError ? error : ""}
        </p>
      )}
    </div>
  );
};

const isDefaultAgencyOnAgenciesAndEnabled = (
  disabled: boolean | undefined,
  defaultAgencyId: string,
  agencies: AgencyIdAndName[],
) => !disabled && agencies.map((agency) => agency.id).includes(defaultAgencyId);

const agenciesRetriever = ({
  departmentCode,
  shouldListAll,
  connectedWith,
}: {
  departmentCode: DepartmentCode;
  shouldListAll: boolean;
  connectedWith: FederatedIdentity | null;
}) => {
  if (shouldListAll) return agencyGateway.listAgencies(departmentCode);
  return connectedWith && isPeConnectIdentity(connectedWith)
    ? agencyGateway.listPeAgencies(departmentCode)
    : agencyGateway.listAgencies(departmentCode);
  // : agencyGateway.listNonPeAgencies(position);
  // -> for easy revert when new page is ready
};

const placeholderAgency: AgencyIdAndName = {
  id: "",
  name: "Veuillez indiquer un code postal",
};

const emptyAgency: AgencyIdAndName = {
  id: "",
  name: "",
};
