import type { ReactNode } from "react";

export type LinkHomeProps = {
  children: ReactNode;
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
  // biome-ignore lint/a11y/useValidAnchor: <explanation>
  <a href={href} onClick={onClick} className={className}>
    {children}
  </a>
);
