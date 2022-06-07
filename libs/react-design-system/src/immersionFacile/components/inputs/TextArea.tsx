import React from "react";

export type TextAreaProperties = {
  name: string;
  value?: string;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
};
export const TextArea = ({
  name,
  value,
  onKeyPress,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled,
}: TextAreaProperties): JSX.Element => (
  <textarea
    id={name}
    value={value}
    name={name}
    onKeyPress={onKeyPress}
    onChange={onChange}
    onBlur={onBlur}
    className={`fr-input${error ? " fr-input--error" : ""}`}
    placeholder={placeholder || ""}
    aria-describedby="text-input-error-desc-error"
    disabled={disabled}
    rows={4}
  />
);
