import { useField } from "formik";
import React from "react";
import { CheckboxGroupProps } from "src/components/form/CheckboxGroup";

type BoolRadioProps = {
  name: string;
  label: string;
  hideNoOption: boolean;
  disabled: boolean;
};

// Like MyRadioGroup, but backs a boolean value.
// Has default "oui/non" options.
export const BoolRadioGroup = ({
  name,
  label,
  hideNoOption,
  disabled,
}: BoolRadioProps) => {
  const [field, meta, { setValue }] = useField<boolean>({ name });
  const error = meta.touched && meta.error;
  const htmlName = error ? "radio" : "radio-error";

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={error ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            error ? "radio-error-legend radio-error-desc-error" : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id={error ? "radio-error-legend" : "radio-legend"}
          >
            {label}
          </legend>
          <div className="fr-fieldset__content">
            <div className="fr-radio-group" key={htmlName + name + "_oui"}>
              <input
                {...field}
                checked={field.value}
                value={field.value.toString()}
                type="radio"
                id={htmlName}
                disabled={disabled}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() => !disabled && setValue(true)}
              >
                oui{" "}
              </label>
            </div>
            {!hideNoOption && (
              <div className="fr-radio-group" key={htmlName + name + "_non"}>
                <input
                  {...field}
                  type="radio"
                  id={htmlName}
                  value={field.value.toString()}
                  checked={!field.value}
                  disabled={disabled}
                />
                <label
                  className="fr-label"
                  htmlFor={htmlName + "non"}
                  onClick={() => !disabled && setValue(false)}
                >
                  non
                </label>
              </div>
            )}
          </div>
          {error && (
            <p id="radio-error-desc-error" className="fr-error-text">
              {error}
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
