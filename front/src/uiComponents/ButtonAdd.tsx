import React from "react";

type ButtonAddProps = {
  onClick: () => void;
  children: string;
  style?: React.CSSProperties;
  className?: string;
};

export const ButtonAdd = ({
  onClick,
  children,
  style,
  className,
}: ButtonAddProps) => (
  <button
    style={style}
    type="button"
    onClick={onClick}
    className={`fr-btn fr-fi-add-line fr-btn--icon-left fr-btn--secondary ${
      className ? className : ""
    }`}
  >
    {children}
  </button>
);
