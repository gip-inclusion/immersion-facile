import React from "react";
import { Input, InputGroup, TextArea, TextInputError } from "../inputs";
import { AutocompleteAttributeValue } from "../inputs/AutocompleteAttributeValue.type";
import { Label } from "../label";
import { FieldDescription } from "./FieldDescription";

export interface ImmersionTextFieldProps {
  autoComplete?: AutocompleteAttributeValue;
  className?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  multiline?: boolean;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
}

export const ImmersionTextField = ({
  autoComplete,
  className,
  description,
  disabled,
  error,
  id,
  label,
  multiline,
  name,
  placeholder,
  readOnly,
  type = "text",
  value,
  onBlur,
  onChange,
  onKeyPress,
}: ImmersionTextFieldProps) => (
  <InputGroup className={className} error={error}>
    <Label label={label} htmlFor={id} />
    {description && FieldDescription({ description })}
    {multiline ? (
      <TextArea
        {...{
          name,
          value,
          onKeyPress,
          onChange,
          onBlur,
          error,
          placeholder,
          disabled,
          id,
          readOnly,
        }}
      />
    ) : (
      <Input
        {...{
          name,
          value,
          type,
          onKeyPress,
          onChange,
          onBlur,
          error,
          placeholder,
          disabled,
          id,
          readOnly,
          autoComplete,
        }}
      />
    )}
    {error && <TextInputError errorMessage={error} />}
  </InputGroup>
);
