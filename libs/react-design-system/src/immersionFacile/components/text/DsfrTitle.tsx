import React from "react";

type DsfrTitleProps = {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  action?: JSX.Element;
};
export const DsfrTitle = ({
  text,
  level = 1,
  className = "",
  action,
}: DsfrTitleProps) => (
  <div className={`fr-h${level} fr-mb-2w ${className}`}>
    {text} {action}
  </div>
);
