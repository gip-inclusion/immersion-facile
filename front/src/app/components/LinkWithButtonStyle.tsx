import React from "react";

interface LinkProps {
  children: React.ReactNode;
  href: string;
  onClick: () => void;
}

export const LinkWithButtonStyle = ({ children, ...props }: LinkProps) => (
  <a className="fr-btn fr-btn--candidate w-full" {...props}>
    {children}
  </a>
);
