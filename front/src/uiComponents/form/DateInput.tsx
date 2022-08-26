import { FieldHookConfig, useField } from "formik";
import React from "react";

type DateInputProps = {
  label: string;
  disabled?: boolean;
  onDateChange: (value: string) => void;
} & FieldHookConfig<string>;

export const DateInput = (props: DateInputProps) => {
  const [field, meta] = useField(props);

  return (
    <>
      <div
        className={`fr-input-group${
          meta.touched && meta.error ? " fr-input-group--error" : ""
        }`}>
        <label className="fr-label" htmlFor="text-input-calendar">
          {props.label}
        </label>
        <div className="fr-input-wrap fr-fi-calendar-line">
          <input
            className={`fr-input${
              meta.touched && meta.error ? " fr-input--error" : ""
            }`}
            {...field}
            value={field.value}
            type="date"
            disabled={props.disabled}
            onChange={(event) => props.onDateChange(event.target.value)}
          />
        </div>
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};
