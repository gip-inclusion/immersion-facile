import React from "react";

import { Input, InputGroup, TextArea, TextInputError } from "../inputs";
import { AutocompleteAttributeValue } from "../inputs/AutocompleteAttributeValue.type";
import { Label } from "../label";

import { FieldDescription } from "./FieldDescription";

export interface ImmersionTextFieldProps {
  name: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  error?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
  type?: string;
  id?: string;
  readOnly?: boolean;
  autoComplete?: AutocompleteAttributeValue;
}

export const ImmersionTextField = ({
  value,
  type = "text",
  onBlur,
  onChange,
  onKeyPress,
  error,
  className,
  placeholder,
  description,
  label,
  multiline,
  disabled,
  name,
  id,
  readOnly,
  autoComplete,
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
