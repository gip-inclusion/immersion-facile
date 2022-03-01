import { useField } from "formik";
import React from "react";
import { ImmersionTextField } from "src/components/form/ImmersionTextField";

type TextInputProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
};

export const TextInput = (props: TextInputProps) => {
  const [field, meta] = useField<string>({ name: props.name });

  return (
    <ImmersionTextField
      {...props}
      {...field}
      error={meta.touched ? meta.error : undefined}
    />
  );
};
