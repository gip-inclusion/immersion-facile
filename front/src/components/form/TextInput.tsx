import { FieldHookConfig, useField } from "formik";
import React from "react";

type TextInputProps = {
  label: string;
  placeholder: string | null;
  description: string | null;
  disabled: boolean;
} & FieldHookConfig<string>;

export const TextInput = (props: TextInputProps) => {
  const [field, meta] = useField(props);
  return (
    <>
      <div
        className={`fr-input-group${
          meta.touched && meta.error ? " fr-input-group--error" : ""
        }`}
      >
        <label className="fr-label" htmlFor={props.id || props.name}>
          {props.label}
        </label>
        {props.description && (
          <span className="fr-hint-text" id="select-hint-desc-hint">
            {props.description}
          </span>
        )}
        <input
          {...field}
          className={`fr-input${
            meta.touched && meta.error ? " fr-input--error" : ""
          }`}
          placeholder={props.placeholder || ""}
          aria-describedby="text-input-error-desc-error"
          disabled={props.disabled}
        />
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};
