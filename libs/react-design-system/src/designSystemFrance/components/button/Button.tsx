import React, { ReactNode, CSSProperties } from "react";
import { ButtonType } from "../../../ux/ButtonType";
import { Emphasis } from "../../../ux/Emphasis";
import { OnClickCallback } from "../../../ux/Actions";
import { Size } from "../../../ux/Size";
import { ClassName } from "../../../dom/ClassName";

export type ButtonProperties = {
  additionnalClassName?: ClassName;
  classNameOveride?: ClassName;
  children?: ReactNode;
  emphasis?: Emphasis;
  isDisabled?: boolean;
  onClick?: OnClickCallback;
  styleOveride?: CSSProperties;
  size?: Size;
  type?: ButtonType;
};

export const Button = ({
  onClick = defaultClickCallback,
  isDisabled = false,
  children = "Button",
  additionnalClassName,
  classNameOveride,
  styleOveride,
  type = "button",
  emphasis = "primary",
  size = "medium",
}: ButtonProperties) => (
  <button
    className={defineClassName(
      emphasis,
      size,
      classNameOveride,
      additionnalClassName
    )}
    style={defineStyle(styleOveride)}
    type={type}
    onClick={onClick}
    disabled={isDisabled}
  >
    {children}
  </button>
);
const defineStyle = (styleOveride?: React.CSSProperties): React.CSSProperties =>
  styleOveride || defaultStyle();

const defineClassName = (
  emphasis: Emphasis,
  size: Size,
  additionnalClassName?: ClassName,
  classNameOveride?: ClassName
): ClassName =>
  classNameOveride || defaultClassName(emphasis, size, additionnalClassName);

const defaultClassName = (
  emphasis: Emphasis,
  size: Size,
  additionnalClassName?: ClassName
) =>
  `fr-btn ${defineEmphasis(emphasis)}${defineSize(size)}${
    additionnalClassName ? ` ${additionnalClassName}` : ""
  }`;

const defineSize = (size: Size) => {
  const supportedSize: Record<Size, ClassName> = {
    small: "fr-btn--sm",
    medium: "",
    large: "fr-btn--lg",
  };
  return supportedSize[size];
};

const defineEmphasis = (emphasis: Emphasis) => {
  const supportedEmphasis: Record<Emphasis, ClassName> = {
    primary: "",
    secondary: "fr-btn--secondary",
    tertiary: "fr-btn--tertiary",
  };
  return supportedEmphasis[emphasis];
};
// eslint-disable-next-line no-console
const defaultClickCallback = () => console.log("Unused Button Click!");
const defaultStyle = (): React.CSSProperties => ({
  margin: "5px",
});
