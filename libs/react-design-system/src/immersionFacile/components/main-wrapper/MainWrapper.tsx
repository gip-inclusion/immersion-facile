import React from "react";

type MainWrapperProps = {
  vSpacing?: number;
  hSpacing?: number;
  children: React.ReactNode;
  className?: string;
};

export const MainWrapper = ({
  vSpacing = 8,
  hSpacing = 0,
  className,
  children,
}: MainWrapperProps) => (
  <main
    className={`fr-main-wrapper ${className} ${
      vSpacing ? `fr-py-${vSpacing}w` : ""
    } ${hSpacing ? `fr-px-${hSpacing}w` : ""}`}>
    {children}
  </main>
);
