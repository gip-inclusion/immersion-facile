import React from "react";

export type ButtonAddProps = {
  onClick: () => void;
  children: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
};

export const ButtonAdd = ({
  onClick,
  children,
  style,
  className,
  disabled,
}: ButtonAddProps) => (
  <button
    style={style}
    type="button"
    onClick={onClick}
    className={`fr-btn fr-fi-add-line fr-btn--icon-left fr-btn--secondary ${
      className ? className : ""
    }`}
    disabled={disabled}
  >
    {children}
  </button>
);
