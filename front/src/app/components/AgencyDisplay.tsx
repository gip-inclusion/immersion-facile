import { CircularProgress } from "@mui/material";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { DepartmentCode } from "shared/src/address/address.dto";
import { AgencyId, AgencyIdAndName } from "shared/src/agency/agency.dto";
import type { ConventionDto } from "shared/src/convention/convention.dto";
import { agencyGateway } from "src/app/config/dependencies";
import { PostcodeAutocomplete } from "src/uiComponents/form/PostcodeAutocomplete";
import { Agencies } from "./Agency";

const placeholderAgency: AgencyIdAndName = {
  id: "",
  name: "Veuillez indiquer un code postal",
};

type AgencyDisplayProps = {
  label: string;
  description?: string;
  agencyId?: string;
};

export const AgencyDisplay = ({
  label,
  description,
  agencyId,
}: AgencyDisplayProps) => {
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [_loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode | null>(
    null,
  );
  const [agencies, setAgencies] = useState([placeholderAgency]);

  useEffect(() => {
    if (!agencyId) return;

    agencyGateway
      .getAgencyPublicInfoById({ id: agencyId })
      .then((agency) => {
        setAgencies([
          {
            id: "",
            name: "",
          },
          { ...agency },
        ]);
        if (agencyId && agencies.map((agency) => agency.id).includes(agencyId))
          setValue(agencyId);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e) => {
        //eslint-disable-next-line no-console
        console.log("AgencyDisplay", e);
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
      <PostcodeAutocomplete onFound={setDepartmentCode} disabled={true} />
      <label className="fr-label pt-4" htmlFor={name}>
        {label}
      </label>
      {description && (
        <span className="fr-hint-text" id="select-hint-desc-hint">
          {description}
        </span>
      )}
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
          disabled={true}
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
