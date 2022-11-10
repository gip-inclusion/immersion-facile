import React, { ReactNode } from "react";

export type ButtonSearchProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  dark?: boolean;
  className?: string;
  type?: "submit" | "button" | "reset";
};

export const ButtonSearch = ({
  children,
  disabled,
  onClick,
  className,
  type = "button",
}: ButtonSearchProps) => (
  <button
    onClick={onClick}
    className={"fr-btn w-full  " + className}
    disabled={disabled}
    type={type}
  >
    {children}
  </button>
);
