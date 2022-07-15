import React from "react";

type LinkHomeProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
};

export const LinkHome = ({
  children,
  className,
  onClick,
  href,
}: LinkHomeProps): JSX.Element => (
  <a href={href} onClick={onClick} className={className}>
    {children}
  </a>
);
