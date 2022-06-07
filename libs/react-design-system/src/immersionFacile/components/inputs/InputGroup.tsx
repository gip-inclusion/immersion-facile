import React, { ReactNode } from "react";

export type InputGroupProperties = {
  children: ReactNode;
  className?: string;
  error?: string;
};

export const InputGroup = ({
  children,
  className,
  error,
}: InputGroupProperties) => (
  <div
    className={`fr-input-group${error ? " fr-input-group--error" : ""} ${
      className ?? ""
    }`}
  >
    {children}
  </div>
);
