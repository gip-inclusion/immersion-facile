import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { cleanStringToHTMLAttribute } from "shared";

type ValueAndLabel<T> = {
  value: T;
  label?: string;
};

type RadioGroupProps<T> = {
  id: string;
  currentValue: T;
  setCurrentValue: (newValue: T) => void;
  groupLabel: string;
  options?: ValueAndLabel<T>[];
  error?: false | string;
  disabled?: boolean;
  description?: string;
};

export const RadioGroup = <T extends string | number | string[] | boolean>({
  id,
  currentValue,
  setCurrentValue,
  groupLabel,
  options,
  error,
  disabled,
  description,
}: RadioGroupProps<T>) => (
  <>
    <div className={fr.cx("fr-input-group", "fr-input-group")}>
      <fieldset
        className={error ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
        aria-labelledby={
          error ? "radio-error-legend radio-error-desc-error" : ""
        }
        role="group"
      >
        <legend className={fr.cx("fr-fieldset__legend", "fr-text--regular")}>
          {groupLabel}
          {description && (
            <span className={fr.cx("fr-hint-text")}>{description}</span>
          )}
        </legend>
        <div className={fr.cx("fr-fieldset__content")}>
          {options &&
            options.map(({ value, label }) => {
              const inputValue = getInputValue(value);
              const optionId = makeOptionId(value, id);

              return (
                <div className={fr.cx("fr-radio-group")} key={optionId}>
                  <input
                    id={optionId}
                    type="radio"
                    disabled={disabled}
                    value={inputValue}
                    checked={isEqual(value, currentValue)}
                    onChange={() => setCurrentValue(value)}
                  />
                  <label className={fr.cx("fr-label")} htmlFor={optionId}>
                    {label ?? value}
                  </label>
                </div>
              );
            })}
        </div>
        {error && (
          <p id="radio-error-desc-error" className={fr.cx("fr-error-text")}>
            {error}
          </p>
        )}
      </fieldset>
    </div>
  </>
);

const makeOptionId = (
  value: string | boolean | number | string[],
  id: string,
): string => {
  let optionId = value.toString();
  if (value instanceof Array) {
    optionId = value[0].toString();
  }
  return cleanStringToHTMLAttribute(`${id}${optionId}`);
};

const getInputValue = (
  value: string | boolean | number | string[],
): string | number | string[] => {
  if (value instanceof Array) return value[0].toString();
  if (typeof value === "boolean") return value.toString();
  return value;
};

const isEqual = <T,>(a: T, b: T): boolean => {
  if (a instanceof Array && b instanceof Array) {
    if (a[0] === undefined || b[0] === undefined) return false;
    return a[0] === b[0];
  }
  return a === b;
};
