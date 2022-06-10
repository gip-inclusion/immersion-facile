import { CircularProgress } from "@mui/material";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { AgencyId, AgencyInListDto } from "shared/src/agency/agency.dto";
import type { ConventionDto } from "shared/src/convention/convention.dto";
import { LatLonDto } from "shared/src/latLon";
import {
  FederatedIdentity,
  isPeConnectIdentity,
} from "src/../../shared/src/federatedIdentities/federatedIdentity.dto";
import { Agencies } from "src/app/components/Agency";
import { agencyGateway } from "src/app/config/dependencies";
import { useConnectedWith } from "src/hooks/connectedWith";
import { PostcodeAutocomplete } from "src/uiComponents/form/PostcodeAutocomplete";
import { useFeatureFlags } from "../utils/useFeatureFlags";

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
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [position, setPosition] = useState<LatLonDto | null>(null);
  const [agencies, setAgencies] = useState([placeholderAgency]);
  const { enablePeConnectApi } = useFeatureFlags();
  const connectedWith = useConnectedWith();
  useEffect(() => {
    if (!position) return;

    setIsLoading(true);
    agenciesRetreiver(position, enablePeConnectApi, connectedWith)
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

const isDefaultAgencyOnAgenciesAndEnabled = (
  disabled: boolean | undefined,
  defaultAgencyId: string,
  agencies: AgencyInListDto[],
) => !disabled && agencies.map((agency) => agency.id).includes(defaultAgencyId);

const agenciesRetreiver = (
  position: LatLonDto,
  enablePeConnectApi: boolean,
  connectedWith: FederatedIdentity | null,
) =>
  enablePeConnectApi
    ? connectedWith && isPeConnectIdentity(connectedWith)
      ? agencyGateway.listPeAgencies(position)
      : agencyGateway.listNonPeAgencies(position)
    : agencyGateway.listAllAgencies(position);

const placeholderAgency: AgencyInListDto = {
  id: "",
  name: "Veuillez indiquer un code postal",
  position: { lat: 0, lon: 0 },
};

const emptyAgency: AgencyInListDto = {
  id: "",
  name: "",
  position: {
    lat: 0,
    lon: 0,
  },
};
