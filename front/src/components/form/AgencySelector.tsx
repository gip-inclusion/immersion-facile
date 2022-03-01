import { CircularProgress } from "@mui/material";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { AgencyInListDto, AgencyId } from "src/shared/agencies";
import { LatLonDto } from "src/shared/SearchImmersionDto";
import { PostcodeAutocomplete } from "./PostcodeAutocomplete";
import type { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";

const placeholderAgency: AgencyInListDto = {
  id: "",
  name: "Veuillez indiquer un code postal",
  position: { lat: 0, lon: 0 },
};

type AgencySelectorProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  defaultAgencyId?: string;
};
export const AgencySelector = ({
  label,
  description,
  disabled,
  defaultAgencyId,
}: AgencySelectorProps) => {
  const name: keyof ImmersionApplicationDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [position, setPosition] = useState<LatLonDto | null>(null);
  const [agencies, setAgencies] = useState([placeholderAgency]);

  useEffect(() => {
    if (!position) return;

    setIsLoading(true);
    immersionApplicationGateway
      .listAgencies(position)
      .then((agencies) => {
        setAgencies([
          {
            id: "",
            name: "",
            position: {
              lat: 0,
              lon: 0,
            },
          },
          ...agencies,
        ]);
        if (
          !disabled &&
          defaultAgencyId &&
          agencies.map((agency) => agency.id).includes(defaultAgencyId)
        )
          setValue(defaultAgencyId);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e) => {
        console.log(e);
        setAgencies([]);
        setLoaded(false);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [position]);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <PostcodeAutocomplete onFound={setPosition} disabled={disabled} />
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
          disabled={disabled || !loaded || !position}
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

type AgenciesProps = {
  agencies: AgencyInListDto[];
};

const Agencies = ({ agencies }: AgenciesProps) => {
  return (
    <>
      {agencies.map(({ id, name }) => (
        <option value={id} key={id} label={name}>
          {name}
        </option>
      ))}
    </>
  );
};
