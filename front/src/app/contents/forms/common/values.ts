import { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from "react";

export type RadioButtonOption = {
  label: ReactNode;
  hintText?: ReactNode;
  nativeInputProps: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
};
export const booleanSelectOptions: RadioButtonOption[] = [
  {
    label: "Oui",
    nativeInputProps: {
      value: 1,
    },
  },
  {
    label: "Non",
    nativeInputProps: {
      value: 0,
    },
  },
];
