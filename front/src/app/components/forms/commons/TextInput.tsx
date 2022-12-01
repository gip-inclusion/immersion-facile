import { useField } from "formik";
import React, { useEffect } from "react";
import { ImmersionTextField } from "react-design-system/immersionFacile";
import { cleanStringToHTMLAttribute } from "shared";

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
      id={cleanStringToHTMLAttribute(props.name)}
      error={meta.touched ? meta.error : undefined}
    />
  );
};

export const TextInputControlled = (
  props: TextInputProps & {
    value: string;
    setValue: (v: string) => void;
    error?: string;
  },
) => {
  const { value } = props;
  const [field, meta, { setError, setValue }] = useField<string>({
    name: props.name,
  });

  useEffect(() => {
    setError(props.error);
    setValue(props.value);
  }, [props.value, props.error]);

  return (
    <ImmersionTextField
      {...props}
      {...field}
      onChange={(e) => {
        props.setValue(e.target.value);
        field.onChange(e.target.value);
      }}
      id={cleanStringToHTMLAttribute(props.name)}
      {...(value && value !== "" && { value })}
      error={meta.touched ? props.error : undefined}
    />
  );
};
