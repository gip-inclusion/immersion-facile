import { useField } from "formik";
import React, { ChangeEvent } from "react";
import {
  AgencyCode,
  agencyCodeFromString,
  agencyCodes,
} from "src/shared/agencies";

type AgencyCodeDropdownProps = {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
};
export const AgencyCodeDropdown = ({
  label,
  name,
  description,
  disabled,
}: AgencyCodeDropdownProps) => {
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyCode>({ name });

  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    setValue(agencyCodeFromString(target.value));
  };

  const showError = touched && error;

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
        disabled={disabled}
      >
        {Object.entries(agencyCodes).map(([code, desc]) => (
          <option
            value={code}
            key={code}
            label={code === "_UNKNOWN" ? "" : desc}
          />
        ))}
      </select>
      {showError && (
        <p id={`agency-code-{name}-error-desc-error`} className="fr-error-text">
          {error}
        </p>
      )}
    </div>
  );
};
