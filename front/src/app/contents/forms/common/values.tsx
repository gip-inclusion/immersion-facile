import type { RadioButtonsProps } from "@codegouvfr/react-dsfr/RadioButtons";
import eyeSvg from "../../../../assets/img/eye.svg";
import eyeOffSvg from "../../../../assets/img/eye-off.svg";

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
    illustration: <img src={eyeOffSvg} alt="" />,
    label: "Non",
    hintText:
      "Vous ne serez pas visible par les candidats jusqu’à ce que vous soyez à nouveau disponible",
    nativeInputProps: {
      value: 0,
    },
  },
  {
    illustration: <img src={eyeSvg} alt="" />,
    label: "Oui",
    hintText:
      "Vous serez visibles par les candidats jusqu’à ce que votre limite de candidatures mensuelle soit atteinte",
    nativeInputProps: {
      value: 1,
    },
  },
];
