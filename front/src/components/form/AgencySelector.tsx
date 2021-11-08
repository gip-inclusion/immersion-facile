import { useField } from "formik";
import React, { ChangeEvent, useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { AgencyDto, AgencyId } from "src/shared/agencies";

type AgencySelectorProps = {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
  setInitialValue?: boolean;
};
export const AgencySelector = ({
  label,
  name,
  description,
  disabled,
  setInitialValue,
}: AgencySelectorProps) => {
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [agencies, setAgencies] = useState([
    {
      id: "",
      name: "Chargement en cours...",
    },
  ] as AgencyDto[]);

  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    setValue(target.value);
  };

  useEffect(() => {
    immersionApplicationGateway
      .listAgencies()
      .then((agencies) => {
        setAgencies([
          {
            id: "",
            name: "",
          },
          ...agencies,
        ]);
        if (setInitialValue) setValue(agencies[0].id);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e) => {
        console.log(e);
        setAgencies([]);
        setLoaded(false);
        setLoadingError(true);
      });
  }, []);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <label className="fr-label" htmlFor={name}>
        {label}
      </label>
      {description && (
        <span className="fr-hint-text" id="select-hint-desc-hint">
          {description}
        </span>
      )}
      <select
        className="fr-select"
        id={name}
        name={name}
        value={value}
        onChange={onChangeHandler}
        onBlur={onBlur}
        aria-describedby={`agency-code-{name}-error-desc-error`}
        disabled={disabled || !loaded}
      >
        {agencies.map(({ id, name }) => {
          return (
            <option value={id} key={id} label={name}>
              {name}
            </option>
          );
        })}
      </select>
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
