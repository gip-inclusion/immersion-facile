import React, { ReactNode } from "react";

export type SubmitButtonProps = {
  disable?: boolean;
  onSubmit?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  type?: "submit" | "button" | "reset";
  level?: "primary" | "secondary";
};

export const Button = ({
  onSubmit,
  disable,
  children,
  className,
  type = "button",
  level = "primary",
}: SubmitButtonProps) => {
  const isSecondary = level === "secondary" ? "fr-btn--secondary" : "";
  return (
    <button
      className={`fr-btn ${isSecondary} ${className}`}
      style={{ margin: "5px" }}
      type={type}
      onClick={onSubmit}
      disabled={disable}
    >
      {children}
    </button>
  );
};
