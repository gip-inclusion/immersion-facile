import React, { ReactNode } from "react";

export type ButtonSearchProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dark?: boolean;
  className?: string;
  type?: "submit" | "button" | "reset";
  id: string;
};

export const ButtonSearch = ({
  children,
  disabled,
  onClick,
  className,
  type = "button",
  id,
}: ButtonSearchProps) => (
  <button
    onClick={onClick}
    className={"fr-btn  " + className}
    disabled={disabled}
    type={type}
    id={id}
  >
    {children}
  </button>
);
