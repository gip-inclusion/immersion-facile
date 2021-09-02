import { FieldHookConfig, FormikHelpers, FormikState, useField } from "formik";
import React from "react";
import { CheckboxGroupProps } from "src/components/form/CheckboxGroup";

type BoolRadioProps = {
  label: string;
  formikHelpers: FormikHelpers<any> & FormikState<any>;
  hideNoOption: boolean;
  description: string;
  descriptionLink: string;
  disabled: boolean;
} & FieldHookConfig<string>;
// Like MyRadioGroup, but backs a boolean value.
// Has default "oui/non" options.
export const BoolRadioGroup = (props: BoolRadioProps) => {
  const [field, meta, helper] = useField(props);
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "radio" : "radio-error";
  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            isError ? "radio-error-legend radio-error-desc-error" : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
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
              className="fr-radio-group"
              key={htmlName + props.name + "_oui"}
            >
              <input
                {...field}
                type="radio"
                id={htmlName}
                checked={props.formikHelpers.values[props.name]}
                disabled={props.disabled}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() =>
                  props.formikHelpers.setFieldValue(props.name, true)
                }
              >
                oui{" "}
              </label>
            </div>
            {!props.hideNoOption && (
              <div
                className="fr-radio-group"
                key={htmlName + props.name + "_non"}
              >
                <input
                  {...field}
                  type="radio"
                  id={htmlName}
                  checked={!props.formikHelpers.values[props.name]}
                  disabled={props.disabled}
                />
                <label
                  className="fr-label"
                  htmlFor={htmlName + "non"}
                  onClick={() =>
                    props.formikHelpers.setFieldValue(props.name, false)
                  }
                >
                  non
                </label>
              </div>
            )}
          </div>
          {isError && (
            <p id="radio-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};
export const RadioGroup = (props: CheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            isError ? "radio-error-legend radio-error-desc-error" : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
          >
            {props.label}
          </legend>
          <div className="fr-fieldset__content">
            {props.values.map((value) => {
              const htmlName = isError ? "radio" : "radio-error";
              return (
                <div
                  className="fr-radio-group"
                  key={htmlName + props.name + value}
                >
                  <input
                    {...field}
                    type="radio"
                    id={htmlName + value}
                    disabled={props.disabled}
                  />
                  <label className="fr-label" htmlFor={htmlName + value}>
                    {value}
                  </label>
                </div>
              );
            })}
          </div>
          {isError && (
            <p id="radio-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};
