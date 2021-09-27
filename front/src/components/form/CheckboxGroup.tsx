import {
  Field,
  FieldHookConfig,
  FormikHelpers,
  FormikState,
  useField,
} from "formik";
import React from "react";

type BoolCheckboxGroupProps = {
  label: string;
  description: string;
  descriptionLink: string;
  disabled?: boolean;
  name: string;
};

export const BoolCheckboxGroup = (props: BoolCheckboxGroupProps) => {
  const [field, meta, { setValue }] = useField<boolean>({ name: props.name });
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "checkBox-error" : "checkbox";

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + isError
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id="checkboxes-error-legend"
          >
            {props.label}
          </legend>
          {props.description && (
            <span className="fr-hint-text" id="select-hint-desc-hint">
              <a href={props.descriptionLink} target="_blank">
                {props.description}
              </a>
            </span>
          )}
          <div className="fr-fieldset__content">
            <div
              className="fr-checkbox-group"
              key={htmlName + props.name + "_oui"}
            >
              <input
                {...field}
                value={""}
                type="checkbox"
                id={htmlName}
                checked={field.value}
                disabled={props.disabled}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() => setValue(!field.value)}
              >
                oui
              </label>
            </div>
          </div>
          {isError && (
            <p id="checkboxes-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

export type CheckboxGroupProps = {
  name: string;
  label: string;
  options: Array<{ value: string; label?: string }>;
  disabled?: boolean;
};

export const CheckboxGroup = ({
  name,
  label,
  options,
  disabled,
}: CheckboxGroupProps) => {
  const [field, meta] = useField({ name });
  const error = meta.touched && meta.error;

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={error ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + error
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id="checkboxes-error-legend"
          >
            {label}
          </legend>
          <div className="fr-fieldset__content">
            {options.map(({ value, label }) => (
              <div className="fr-checkbox-group" key={value}>
                <Field
                  type="checkbox"
                  {...field}
                  name={name}
                  value={value}
                  id={value}
                  disabled={disabled}
                />
                <label className="fr-label" htmlFor={value}>
                  {label ?? value}
                </label>
              </div>
            ))}
          </div>
          {error && (
            <p id="checkboxes-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};
