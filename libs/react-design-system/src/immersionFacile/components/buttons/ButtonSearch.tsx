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
  dark,
  onClick,
  className,
  type = "button",
}: ButtonSearchProps) => (
  <button
    onClick={onClick}
    className={
      "px-16 py-2 text-white flex justify-around font-semibold rounded-md" +
      className +
      " " +
      (dark ? " bg-immersionRed-veryDark" : "bg-immersionRed-light")
    }
    disabled={disabled}
    type={type}
  >
    {children}
  </button>
);
