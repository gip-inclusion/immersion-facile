import type {
  ChangeEventHandler,
  FocusEventHandler,
  HTMLInputTypeAttribute,
  KeyboardEventHandler,
} from "react";
import type { AutocompleteAttributeValue } from "./AutocompleteAttributeValue.type";

export type InputProperties = {
  autoComplete?: AutocompleteAttributeValue;
  disabled?: boolean;
  error?: string;
  id?: string;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
  type?: HTMLInputTypeAttribute;
  value?: string;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyPress?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
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
