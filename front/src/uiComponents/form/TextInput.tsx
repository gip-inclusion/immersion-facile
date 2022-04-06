import { useField } from "formik";
import React from "react";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";

type TextInputProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  value?: string;
};

export const TextInput = (props: TextInputProps) => {
  const { value } = props;
  const [field, meta] = useField<string>({ name: props.name });

  return (
    <ImmersionTextField
      {...props}
      {...field}
      {...(value && value !== "" && { value })}
      error={meta.touched ? meta.error : undefined}
    />
  );
};
