import React, { ReactNode } from "react";

type SubmitButtonProps = {
  disable?: boolean;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  level?: "primary" | "secondary";
};

export const Button = ({
  onSubmit,
  disable,
  children,
  className,
  level = "primary",
}: SubmitButtonProps) => {
  const isSecondary = level === "secondary" ? "fr-btn--secondary" : "";

  return (
    <button
      className={`fr-btn ${isSecondary} ${className}`}
      style={{ margin: "5px" }}
      type="button"
      onClick={onSubmit}
      disabled={disable}
    >
      {children}
    </button>
  );
};
