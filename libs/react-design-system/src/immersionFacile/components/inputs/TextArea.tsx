import React from "react";

export type TextAreaProperties = {
  disabled?: boolean;
  error?: string;
  id?: string;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
  value?: string;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};
export const TextArea = ({
  disabled,
  error,
  id,
  name,
  placeholder,
  readOnly,
  value,
  onKeyPress,
  onChange,
  onBlur,
}: TextAreaProperties): JSX.Element => (
  <textarea
    id={id}
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
    readOnly={readOnly}
  />
);
