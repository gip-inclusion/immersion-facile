import { RadioButtonsProps } from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import errorSvg from "../../../../assets/img/error.svg";
import successSvg from "../../../../assets/img/success.svg";

export const booleanSelectOptions: RadioButtonsProps["options"] = [
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

export const richBooleanSelectOptions: RadioButtonsProps["options"] = [
  {
    illustration: <img src={errorSvg} alt="" />,
    label: "Non",
    nativeInputProps: {
      value: 0,
    },
  },
  {
    illustration: <img src={successSvg} alt="" />,
    label: "Oui",
    nativeInputProps: {
      value: 1,
    },
  },
];
