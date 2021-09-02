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
  formikHelpers: FormikHelpers<any> & FormikState<any>;
  description: string;
  descriptionLink: string;
  disabled: boolean;
} & FieldHookConfig<string>;

export const BoolCheckboxGroup = (props: BoolCheckboxGroupProps) => {
  const [field, meta] = useField(props);
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
                type="checkbox"
                id={htmlName}
                checked={props.formikHelpers.values[props.name]}
                disabled={props.disabled}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() => {
                  if (field.value)
                    props.formikHelpers.setFieldValue(props.name, false, true);
                  else
                    props.formikHelpers.setFieldValue(props.name, true, true);
                }}
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
  label: string;
  values: Array<string>;
  disabled: boolean;
} & FieldHookConfig<string>;

export const CheckboxGroup = (props: CheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;

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
          <div className="fr-fieldset__content">
            {props.values.map((value) => (
              <div className="fr-checkbox-group" key={value}>
                <Field
                  type="checkbox"
                  {...field}
                  name={props.name}
                  value={value}
                  id={value}
                />
                <label className="fr-label" htmlFor={value}>
                  {value}
                </label>
              </div>
            ))}
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
