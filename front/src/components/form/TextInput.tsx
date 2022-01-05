import { useField } from "formik";
import React from "react";

type TextInputProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  multiline?: boolean;
};

export const TextInput = ({
  name,
  type,
  label,
  placeholder,
  description,
  disabled,
  multiline,
}: TextInputProps) => {
  const [field, meta] = useField<string>({ name });

  return (
    <>
      <div
        className={`fr-input-group${
          meta.touched && meta.error ? " fr-input-group--error" : ""
        }`}
      >
        <label className="fr-label" htmlFor={name}>
          {label}
        </label>
        {description && (
          <span className="fr-hint-text" id="select-hint-desc-hint">
            {description}
          </span>
        )}
        {multiline ? (
          <textarea
            {...field}
            className={`fr-input${
              meta.touched && meta.error ? " fr-input--error" : ""
            }`}
            placeholder={placeholder || ""}
            aria-describedby="text-input-error-desc-error"
            disabled={disabled}
            rows={4}
          />
        ) : (
          <input
            type={type}
            {...field}
            className={`fr-input${
              meta.touched && meta.error ? " fr-input--error" : ""
            }`}
            placeholder={placeholder || ""}
            aria-describedby="text-input-error-desc-error"
            disabled={disabled}
          />
        )}
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};
