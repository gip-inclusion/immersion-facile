import React, { ReactNode } from "react";

export type SubmitButtonProps = {
  disable?: boolean;
  onSubmit?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  type?: "submit" | "button" | "reset";
  level?: "primary" | "secondary";
  url?: string;
};

export const Button = ({
  onSubmit,
  disable,
  children,
  className,
  url,
  type = "button",
  level = "primary",
}: SubmitButtonProps) => {
  const isLink = url && url !== "";
  const isSecondary = level === "secondary" ? "fr-btn--secondary" : "";
  const classes = `fr-btn ${isSecondary} ${className}`;
  const Element = isLink ? "a" : "button";
  const props = isLink
    ? {
        className: classes,
        href: url,
        disabled: disable,
      }
    : {
        className: classes,
        type,
        onClick: onSubmit,
        disabled: disable,
      };
  return <Element {...props}>{children}</Element>;
};
