import React from "react";
import { AutocompleteAttributeValue } from "./AutocompleteAttributeValue.type";

export type InputProperties = {
  autoComplete?: AutocompleteAttributeValue;
  disabled?: boolean;
  error?: string;
  id?: string;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
};
export const Input = ({
  autoComplete,
  disabled,
  error,
  id,
  name,
  placeholder,
  readOnly,
  type,
  value,
  onBlur,
  onChange,
  onKeyPress,
}: InputProperties): JSX.Element => (
  <input
    id={id}
    value={value}
    type={type}
    name={name}
    onKeyPress={onKeyPress}
    onChange={onChange}
    onBlur={onBlur}
    className={`fr-input${error ? " fr-input--error" : ""}`}
    placeholder={placeholder || ""}
    aria-describedby="text-input-error-desc-error"
    disabled={disabled}
    readOnly={readOnly}
    autoComplete={autoComplete}
  />
);
