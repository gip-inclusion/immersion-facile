import { FieldHookConfig } from "formik";
import React from "react";

type BoolRadioPickerProps = {
  label: string;
  description: string;
  yesLabel: string;
  noLabel: string;
  checked: boolean;
  setFieldValue: (isSimple: boolean) => void;
  disabled?: boolean;
} & FieldHookConfig<boolean>;
export const BoolRadioPicker = (props: BoolRadioPickerProps) => {
  const setFieldAsTrue = () => !props.disabled && props.setFieldValue(true);
  const setFieldAsFalse = () => !props.disabled && props.setFieldValue(false);

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className="fr-fieldset"
          role="group"
          disabled={props.disabled}>
          <legend className="fr-fieldset__legend fr-text--regular">
            {props.label}
          </legend>
          {props.description && (
            <span className="fr-hint-text" id="select-hint-desc-hint">
              {props.description}
            </span>
          )}
          <div className="fr-fieldset__content">
            <div className="fr-radio-group" key={props.name + "_oui"}>
              <input
                id={props.name + "radio_yes"}
                type="radio"
                checked={props.checked}
                onChange={setFieldAsTrue}
                disabled={props.disabled}
              />
              <label
                className="fr-label"
                htmlFor={props.name + "radio_yes"}
                onClick={setFieldAsTrue}>
                {props.yesLabel}
              </label>
            </div>
            <div className="fr-radio-group" key={props.name + "_non"}>
              <input
                id={props.name + "radio_no"}
                type="radio"
                checked={!props.checked}
                onChange={setFieldAsFalse}
                disabled={props.disabled}
              />
              <label
                className="fr-label"
                htmlFor={props.name + "radio_no"}
                onClick={setFieldAsFalse}>
                {props.noLabel}
              </label>
            </div>
          </div>
        </fieldset>
      </div>
    </>
  );
};
