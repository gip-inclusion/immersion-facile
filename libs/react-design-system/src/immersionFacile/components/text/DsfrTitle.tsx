import React from "react";

type DsfrTitleProps = {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
};
export const DsfrTitle = ({ text, level = 1, className }: DsfrTitleProps) => (
  <div className={`fr-h${level} mb-2 ${className}`}>{text}</div>
);
